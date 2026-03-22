import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# 引入核心模块
from app.models.bpnl import FlowSchema
from app.engine.compiler import BPNLCompiler
from app.engine.state import AgentState
from app.engine.router_agent import process_chat_intent
from app.core.storage import FileStorage
from app.execution.llm import ask_llm  # 用于迭代 Optimizer Agent

app = FastAPI(title="BizFlow Orchestration Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "BizFlow Engine is Alive", "version": "1.0.0"}

# ==============================================================================
# 模块 I：元数据与全域资产总台 (Meta Asset Hub)
# ==============================================================================

@app.get("/api/assets/meta")
async def get_system_meta_assets():
    """
    扫描整个 FileDB 的存储状况，返回各域的表结构及数据量
    这让 BizFlow 拥有了对自身的 '反射' (Reflection) 能力
    """
    domains = ["flows", "models", "skills", "integrations", "monitors", "chats", "agents", "traces", "cases","workspaces"]
    meta_stats = []
    
    for domain in domains:
        records = FileStorage.list_all(domain)
        # 计算存储大小 (粗略计算 JSON 字节数)
        size_bytes = sum(len(json.dumps(r, ensure_ascii=False)) for r in records)
        size_kb = round(size_bytes / 1024, 2)
        
        meta_stats.append({
            "id": f"sys_db_{domain}",
            "name": f"系统库: {domain.capitalize()}",
            "category": "System Meta-Data",
            "type": "JSON FileDB",
            "records": len(records),
            "size": f"{size_kb} KB",
            "domain": domain,
            "last_updated": "Just now",
            "is_system": True
        })
        
    return {"status": "success", "data": meta_stats}



# ==============================================================================
# 模块 A：Chat 与意图路由 (Intent Router)
# ==============================================================================
class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_copilot(req: ChatRequest):
    """
    接收前端对话，进行意图解析：
    1. 普通对话 -> 返回 GENERAL_CHAT
    2. 复杂任务 -> LLM 动态生成 BPNL 流程图 -> 自动落盘到 FileDB -> 返回 COMPLEX_TASK
    """
    print(f"\n💬 [API] 收到前端 Chat 请求: {req.message}")
    result = process_chat_intent(req.message)
    print(f"✅ [API] 意图解析完成，返回类型: {result.get('type')}")
    return result


# ==============================================================================
# 模块 B：聊天历史持久化 (Chats Ledger)
# ==============================================================================
class ChatSessionParams(BaseModel):
    id: str
    title: str
    time: str
    messages: list

@app.get("/api/chats")
async def get_chat_sessions():
    """获取历史聊天列表"""
    chats = FileStorage.list_all("chats")
    chats.sort(key=lambda x: x.get("id", ""), reverse=True)
    return {"status": "success", "data": chats}

@app.post("/api/chats")
async def save_chat_session(session: ChatSessionParams):
    """保存或更新单个聊天会话"""
    FileStorage.save("chats", session.dict(), session.id)
    return {"status": "success"}

# ==============================================================================
# 模块 B-7：公共频道群聊持久化 (Workspace Channels)
# ==============================================================================
class ChannelMessage(BaseModel):
    id: str
    type: str
    user: Optional[str] = None
    agentId: Optional[str] = None
    agentName: Optional[str] = None
    text: str
    time: str
    isAction: Optional[bool] = False
    actionCard: Optional[dict] = None

class WorkspaceChannel(BaseModel):
    id: str
    name: str
    unread: int
    desc: str
    messages: List[ChannelMessage]

@app.get("/api/workspaces")
async def get_workspace_channels():
    """获取所有群聊频道及其历史消息"""
    channels = FileStorage.list_all("workspaces")
    
    # 注入出厂默认的三个频道和演示消息
    if not channels:
        default_channels = [
            {
                "id": "marketing", "name": "营销活动与增长", "unread": 2, 
                "desc": "与 [文案写手] 和 [数据分析师] 共同策划 Campaign",
                "messages": [
                    {"id": "m1", "type": "system", "text": "Welcome to #营销活动与增长 channel. Agent [文案小李] and [数据老王] have joined.", "time": "09:00 AM"},
                    {"id": "m2", "type": "human", "user": "产品经理 (我)", "text": "大家早上好。我们需要策划一下下周五的大促。@数据老王 拉一下去年数据。", "time": "09:05 AM"},
                    {"id": "m3", "type": "agent", "agentId": "a_data", "agentName": "数据老王", "text": "收到。已生成可视化报表，是否需要我将数据喂给 @文案小李？", "time": "09:06 AM", "isAction": False},
                    {"id": "m4", "type": "human", "user": "产品经理 (我)", "text": "好的。@文案小李 根据数据写推文。", "time": "09:10 AM"},
                    {"id": "m5", "type": "agent", "agentId": "a_writer", "agentName": "文案小李", "text": "文案已生成完毕，并已打包为标准 SOP 卡片。您可以直接一键分发。", "time": "09:12 AM", "isAction": True, "actionCard": {"title": "大促推文分发 SOP", "nodes": 3, "target": "Social Media"}}
                ]
            },
            {"id": "customer_service", "name": "售后与投诉处理", "unread": 0, "desc": "与 [客服专员] 处理客诉 SOP", "messages": []},
            {"id": "finance", "name": "财务对账与报销", "unread": 5, "desc": "与 [财务审批流] 对接", "messages": []}
        ]
        for c in default_channels:
            FileStorage.save("workspaces", c, c["id"])
        channels = default_channels

    return {"status": "success", "data": channels}

@app.post("/api/workspaces")
async def save_workspace_channel(channel: WorkspaceChannel):
    """保存或更新单个频道的消息记录"""
    FileStorage.save("workspaces", channel.dict(), channel.id)
    return {"status": "success"}

# ==============================================================================
# 模块 C：资产管理 API (业务流程 Flows)
# ==============================================================================
# 高级排版格式的兜底 Demo 流程 (包含 Phase 和 Sublane 容器)

# 修复：真正的工业级左右泳道排版布局
mock_default_bpnl = {
    "id": "flow_sdr_001",
    "name": "智能拓客与CRM录入 (标准排版)",
    "nodes": [
        # Phase 1: 宽度 640 (容纳 2 个 320 宽的泳道)
        {"id": "Phase_1", "type": "phaseNode", "position": {"x": 0, "y": 0}, "style": {"width": 640, "height": 800, "zIndex": -1}, "data": {"label": "信息收集与校验", "pill": "CAPTURE", "stats": "2 子泳道"}, "draggable": False, "selectable": False},
        # Phase 2: 宽度 320 (容纳 1 个 320 宽的泳道)
        {"id": "Phase_2", "type": "phaseNode", "position": {"x": 680, "y": 0}, "style": {"width": 320, "height": 800, "zIndex": -1}, "data": {"label": "核心业务处理", "pill": "PROCESSING", "stats": "1 子泳道"}, "draggable": False, "selectable": False},
        
        # 泳道：左右并排排列 (注意 x 的变化)
        {"id": "Lane_1_Main", "type": "sublaneNode", "parentNode": "Phase_1", "position": {"x": 0, "y": 46}, "style": {"width": 320, "height": 754, "zIndex": 0}, "data": {"label": "▶ 主干流水线"}, "draggable": False, "selectable": False},
        {"id": "Lane_1_Exception", "type": "sublaneNode", "parentNode": "Phase_1", "position": {"x": 320, "y": 46}, "style": {"width": 320, "height": 754, "zIndex": 0}, "data": {"label": "🛑 告警/重试分支"}, "draggable": False, "selectable": False},
        {"id": "Lane_2_Audit", "type": "sublaneNode", "parentNode": "Phase_2", "position": {"x": 0, "y": 46}, "style": {"width": 320, "height": 754, "zIndex": 0}, "data": {"label": "⚖️ 核心审核与熔断区"}, "draggable": False, "selectable": False},
        
        # 业务节点
        {"id": "N1_Search", "type": "bizNode", "parentNode": "Lane_1_Main", "extent": "parent", "position": {"x": 30, "y": 60}, "style": {"zIndex": 10}, "data": {"id": "N1_Search", "label": "LinkedIn 搜索", "components": [{"step_id": "s1", "type": "action", "tool_name": "browser_open", "params": {}}]}},
        {"id": "N2_Check", "type": "bizNode", "parentNode": "Lane_1_Main", "extent": "parent", "position": {"x": 30, "y": 200}, "style": {"zIndex": 10}, "data": {"id": "N2_Check", "label": "判断是否需要接管", "components": [{"step_id": "s2", "type": "judge", "tool_name": "vision_llm", "params": {}}]}},
        {"id": "N4_Fail_Notify", "type": "bizNode", "parentNode": "Lane_1_Exception", "extent": "parent", "position": {"x": 30, "y": 200}, "style": {"zIndex": 10}, "data": {"id": "N4_Fail_Notify", "label": "失败告警", "components": [{"step_id": "s4", "type": "notify", "tool_name": "dingtalk_bot", "params": {}}]}},
        {"id": "N3_CRM_Entry", "type": "bizNode", "parentNode": "Lane_2_Audit", "extent": "parent", "position": {"x": 30, "y": 300}, "style": {"zIndex": 10}, "data": {"id": "N3_CRM_Entry", "label": "录入老旧 CRM", "interrupt_before": True, "components": [{"step_id": "s3", "type": "action", "tool_name": "crm_api_submit", "params": {}}]}}
    ],
    "edges": [
        {"id": "e1", "source": "N1_Search", "target": "N2_Check", "animated": True, "style": {"stroke": "#3b82f6", "strokeWidth": 2}},
        {"id": "e2", "source": "N2_Check", "target": "N3_CRM_Entry", "label": "No Captcha", "animated": True, "style": {"stroke": "#10b981", "strokeWidth": 2, "strokeDasharray": "5 5"}},
        {"id": "e3", "source": "N2_Check", "target": "N4_Fail_Notify", "label": "Has Captcha", "animated": True, "style": {"stroke": "#ef4444", "strokeWidth": 2}}
    ]
}

@app.get("/api/flows")
async def get_all_flows():
    flows = FileStorage.list_all("flows")
    if not flows:
        # 如果系统里没有图纸，自动生成一个兜底的高级排版图纸
        FileStorage.save("flows", mock_default_bpnl, mock_default_bpnl["id"])
        flows = [mock_default_bpnl]
    return {"status": "success", "data": flows}

@app.get("/api/flows/{flow_id}")
async def get_flow_by_id(flow_id: str):
    flow_data = FileStorage.get("flows", flow_id)
    if not flow_data:
        return {"status": "error", "msg": "流程图文件不存在，请检查 FileDB"}
    return {"status": "success", "data": flow_data}

# 💡 新增：前端画布保存接口！
@app.post("/api/flows")
async def save_flow(flow: FlowSchema):
    """
    接收前端 Studio 画布的最新排版和节点属性，覆盖保存至硬盘
    """
    try:
        # 将 Pydantic 模型转为字典，并保存到 FileDB
        FileStorage.save("flows", flow.dict(), flow.id)
        print(f"💾 [Studio] 流程图资产已更新并落盘: {flow.name} ({flow.id})")
        return {"status": "success", "msg": "流程图资产已成功保存！"}
    except Exception as e:
        print(f"❌ [Studio] 保存流程图失败: {e}")
        return {"status": "error", "msg": f"保存失败: {str(e)}"}


# ==============================================================================
# 模块 D：智能体自我进化 API (Optimizer Agent)
# ==============================================================================
class OptimizeRequest(BaseModel):
    flow_id: str
    case_reason: str
    human_action: str

@app.post("/api/optimize_flow")
async def optimize_flow_by_agent(req: OptimizeRequest):
    """
    根据人类在 Ledger 里记录的修正动作，自动调用大模型重写底层的 BPNL JSON 流程图
    """
    print(f"\n🧠 [Optimizer Agent] 收到优化请求。目标流程: {req.flow_id}")
    
    old_flow = FileStorage.get("flows", req.flow_id)
    if not old_flow:
        return {"status": "error", "msg": "找不到原流程"}

    prompt = f"""
    你是一个工作流优化智能体。请分析现有的 BPNL 流程图 JSON，并根据人类的接管记录对其进行升级修复。
    【失败原因】: {req.case_reason}
    【人类修正方案】: {req.human_action}
    【要求】: 仅输出修改后的 BPNL JSON 代码块。你可以在对应的 Node 中增加参数，或修改连线。
    【原图 JSON】: {json.dumps(old_flow, ensure_ascii=False)}
    """
    
    response = ask_llm(prompt, system_prompt="你必须严格输出 JSON 格式的 BPNL 图。")
    
    if "```json" in response:
        try:
            json_str = response.split("```json")[1].split("```")[0].strip()
            optimized_flow = json.loads(json_str)
            # 覆盖写入
            FileStorage.save("flows", optimized_flow, req.flow_id)
            print(f"✅ [Optimizer Agent] 流程 {req.flow_id} 已成功自我进化并覆写落盘！")
            return {"status": "success", "msg": "流程图已根据历史记录优化完成！", "data": optimized_flow}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
            
    return {"status": "error", "msg": "大模型未能生成合法的 JSON"}


# ==============================================================================
# 模块 E：大模型基建配置 (Models)
# ==============================================================================
class ModelConfig(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    api_key: str = ""

@app.get("/api/models")
async def get_system_models():
    models = FileStorage.list_all("models")
    if not models:
        default_models = [
            {"id": "gpt-4o", "name": "GPT-4 Omni", "provider": "OpenAI", "type": "LLM & Vision", "api_key": ""},
            {"id": "deepseek-chat", "name": "DeepSeek V3", "provider": "DeepSeek", "type": "LLM (Reasoning)", "api_key": ""}
        ]
        for m in default_models:
            FileStorage.save("models", m, m["id"])
        models = default_models

    for m in models:
        key = m.get("api_key", "")
        m["status"] = "active" if key and "xxxx" not in key else "error"
        m["api_key_masked"] = f"{key[:5]}...{key[-4:]}" if len(key) > 10 else "***" if key else ""

    return {"status": "success", "data": models}

@app.post("/api/models")
async def add_new_model(model: ModelConfig):
    FileStorage.save("models", model.dict(), model.id)
    return {"status": "success", "msg": "模型配置已保存"}

# ==============================================================================
# 模块 E-2：数字员工资产 API (Agents)
# ==============================================================================
class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    desc: str
    model: str
    skills: list
    isSystem: bool
    status: str = "active"

@app.get("/api/agents")
async def get_system_agents():
    """获取所有已持久化的数字员工 (Agents)"""
    agents = FileStorage.list_all("agents")
    
    # 如果硬盘里没数据，注入出厂默认的三个“系统级/示范级”员工
    if not agents:
        default_agents = [
            {
                "id": "agent_router", "name": "Intent Router (系统主脑)", "role": "System Core",
                "desc": "负责在 Copilot 窗口接待用户，分析意图，动态生成并分发 SOP。",
                "model": "GPT-4 Omni", "skills": ["Zero-shot BPNL Gen", "Intent Analysis"],
                "status": "active", "isSystem": True
            },
            {
                "id": "agent_researcher", "name": "Web 调研员", "role": "Executor",
                "desc": "专精于操控无头浏览器进行深度信息搜集与长文本总结。",
                "model": "Claude 3.5 Sonnet", "skills": ["browser_use", "vision_parser"],
                "status": "active", "isSystem": False
            },
            {
                "id": "agent_auditor", "name": "合规核查员", "role": "Supervisor / Auditor",
                "desc": "挂载在流程图的断点处，负责检查关键数据的合规性，判断是否需要呼叫人类。",
                "model": "Qwen Max", "skills": ["rule_engine_eval", "dingtalk_notify"],
                "status": "idle", "isSystem": False
            }
        ]
        for a in default_agents:
            FileStorage.save("agents", a, a["id"])
        agents = default_agents

    return {"status": "success", "data": agents}

@app.post("/api/agents")
async def save_agent(agent: AgentConfig):
    """保存或更新单个数字员工"""
    FileStorage.save("agents", agent.dict(), agent.id)
    return {"status": "success", "msg": "数字员工配置已保存"}

# ==============================================================================
# 模块 F：第三方生态集成 (Integrations)
# ==============================================================================
class IntegrationConfig(BaseModel):
    id: str
    name: str
    desc: str
    type: str
    color: str
    config: dict

@app.get("/api/integrations")
async def get_integrations():
    integrations = FileStorage.list_all("integrations")
    if not integrations:
        default_apps = [
            {"id": "lark", "name": "飞书 (Lark)", "desc": "双向打通：接收飞书群消息指令，向飞书发送执行报告。", "type": "IM & Bot", "color": "bg-[#3370FF]", "config": {"app_id": "", "webhook": ""}},
            {"id": "notion", "name": "Notion", "desc": "知识库同步：自动将抓取的数据格式化并写入指定的 Database。", "type": "Workspace", "color": "bg-slate-800", "config": {"token": ""}},
            {"id": "github", "name": "GitHub", "desc": "研发联动：拉取代码仓库内容进行 Code Review。", "type": "Developer", "color": "bg-[#24292F]", "config": {"personal_access_token": ""}}
        ]
        for app in default_apps:
            FileStorage.save("integrations", app, app["id"])
        integrations = default_apps

    for app in integrations:
        config_values = app.get("config", {}).values()
        is_configured = all(v != "" for v in config_values) and len(config_values) > 0
        app["status"] = "active" if is_configured else "error"
        
        masked_config = {}
        for k, v in app.get("config", {}).items():
            masked_config[k] = f"{v[:4]}...{v[-4:]}" if len(v) > 10 else ("***" if v else "")
        app["config_masked"] = masked_config

    return {"status": "success", "data": integrations}

@app.post("/api/integrations")
async def save_integration(app_data: IntegrationConfig):
    FileStorage.save("integrations", app_data.dict(), app_data.id)
    return {"status": "success", "msg": "集成配置已保存"}

# ==============================================================================
# 模块 B-6：运行时数据与人工修正账本 (Traces & Cases)
# ==============================================================================
class TraceLog(BaseModel):
    id: str
    flow_id: str
    intent: str
    user: str
    status: str
    time: str
    duration: str

class InterventionCase(BaseModel):
    id: str
    flow_id: str
    node_id: str
    reason: str
    human_action: str
    time: str

@app.get("/api/traces")
async def get_traces():
    """获取所有任务执行轨迹"""
    traces = FileStorage.list_all("traces")
    
    # 注入演示数据
    if not traces:
        default_traces = [
            {"id": "TRC-10024", "intent": "背调 Shopify 并录入 CRM", "flow_id": "智能拓客与CRM录入", "user": "销售-张三", "status": "success", "time": "10 mins ago", "duration": "45s"},
            {"id": "TRC-10023", "intent": "查一下用户 U-882 的风控", "flow_id": "KYC 自动化复核", "user": "风控-李四", "status": "suspended", "time": "1 hour ago", "duration": "Running"}
        ]
        for t in default_traces:
            FileStorage.save("traces", t, t["id"])
        traces = default_traces

    return {"status": "success", "data": traces}

@app.post("/api/traces")
async def save_trace(trace: TraceLog):
    FileStorage.save("traces", trace.dict(), trace.id)
    return {"status": "success"}

@app.get("/api/cases")
async def get_intervention_cases():
    """获取所有人工介入修正的 Case 记录"""
    cases = FileStorage.list_all("cases")
    
    # 注入演示数据
    if not cases:
        default_cases = [
            {"id": "CASE-009", "flow_id": "智能拓客与CRM录入", "node_id": "N3_CRM_Entry", "reason": "找不到[保存]按钮", "human_action": "Clicked XPath: /div/dropdown/li[3]", "time": "Yesterday"},
            {"id": "CASE-008", "flow_id": "KYC 自动化复核", "node_id": "N2_AntiFraud", "reason": "新版图形验证码识别失败", "human_action": "Manually solved Captcha slider", "time": "2 days ago"}
        ]
        for c in default_cases:
            FileStorage.save("cases", c, c["id"])
        cases = default_cases

    return {"status": "success", "data": cases}

@app.post("/api/cases")
async def save_case(case_data: InterventionCase):
    FileStorage.save("cases", case_data.dict(), case_data.id)
    return {"status": "success"}

# ==============================================================================
# 模块 G：监控与熔断规则 (Monitors & Guards)
# ==============================================================================
@app.get("/api/monitors")
async def get_monitors():
    monitors = FileStorage.list_all("monitors")
    if not monitors:
        default_rules = [
            {"id": "m_budget", "name": "全局 Token 熔断", "target": "Global", "condition": "Single Run Token > $0.5", "action": "Suspend & Alert", "status": "active"},
            {"id": "m_captcha", "name": "反爬虫/验证码拦截", "target": "Action: browser_open", "condition": "Detect 'CAPTCHA' in DOM", "action": "Suspend & HITL", "status": "active"},
            {"id": "m_sensitive", "name": "敏感数据写入", "target": "Action: crm_api_submit", "condition": "Always", "action": "Require Human Confirm", "status": "active"}
        ]
        for rule in default_rules:
            FileStorage.save("monitors", rule, rule["id"])
        monitors = default_rules
    return {"status": "success", "data": monitors}


# ==============================================================================
# 模块 H：执行总线 WS (LangGraph 运行调度器)
# ==============================================================================
@app.websocket("/ws/state")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("\n🔌 [WebSocket] 前端驾驶舱已连接 WS_STATE!")
    
    try:
        while True:
            raw_data = await websocket.receive_text()
            if raw_data.startswith("START_TASK"):
                # 获取前端要跑的图的 ID
                flow_id_to_run = raw_data.split("|")[1] if len(raw_data.split("|")) > 1 else "flow_sdr_001"
                await websocket.send_json({"type": "log", "msg": f"🚀 [System] 任务点火：准备加载图纸 {flow_id_to_run}..."})
                
                flow_data = FileStorage.get("flows", flow_id_to_run)
                if not flow_data:
                    await websocket.send_json({"type": "log", "msg": f"❌ [System] 错误：找不到流程图 {flow_id_to_run}"})
                    continue
                
                try:
                    schema = FlowSchema(**flow_data)
                    compiler = BPNLCompiler(schema)
                    compiled_graph = compiler.compile()
                    await websocket.send_json({"type": "log", "msg": "✅ [System] LangGraph 内存状态机编译成功，开始流转。"})
                except Exception as compile_err:
                    await websocket.send_json({"type": "log", "msg": f"❌ [System] 编译流程图失败: {compile_err}"})
                    continue
                
                initial_state = AgentState(
                    task_id="task_1001", flow_id=flow_id_to_run, context_data={"has_captcha": False}, traces=[], next_node=""
                )
                
                # 遍历执行图
                for output in compiled_graph.stream(initial_state, {"configurable": {"thread_id": "ws_1"}}):
                    node_id = list(output.keys())[0]
                    await websocket.send_json({"type": "node_active", "node_id": node_id})
                    await websocket.send_json({"type": "log", "msg": f"⚙️ [Executor] 进入节点: {node_id}"})
                    await asyncio.sleep(1.5) 
                    await websocket.send_json({"type": "log", "msg": f"✅ [Executor] 节点 {node_id} 执行成功。"})
                    await asyncio.sleep(0.5)

                await websocket.send_json({"type": "log", "msg": "🛑 [Auditor] 流程流转完毕或被规则安全挂起。"})
                await websocket.send_json({"type": "node_active", "node_id": None})
                
    except WebSocketDisconnect:
        print("🔌 [WebSocket] 前端驾驶舱已断开连接")