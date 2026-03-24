import json
from app.execution.llm import ask_llm
from app.core.storage import FileStorage

# ==============================================================================
# GridsPilot 核心宪法：意图路由引擎 (Intent Router)
# 设计哲学：坚决剥夺大模型“凭空捏造”业务流程的权力。
# 所有的业务流 (SOP) 必须是人类架构师在 Studio 中画好、并固化在 FileDB 里的真实资产。
# Router 的唯一职责是：理解自然语言，并从真实资产库中进行【精准匹配 (Semantic Routing)】。
# ==============================================================================

MASTER_ROUTER_PROMPT = """
你是 GridsPilot OS 的核心中枢智能体 (Intent Router)。
你的唯一职责是：理解用户的自然语言输入，并从系统现有的【已认证业务流程库 (SOP Assets)】中，精准匹配最合适的流程。

【判断逻辑】：
1. 如果用户只是进行普通问候、闲聊、或询问通用信息 -> 直接用自然语言回答即可，不要输出 JSON。
2. 如果用户要求执行一个具体的业务任务 -> 你必须从下方的【已认证业务流程库】中，寻找与用户意图最匹配的流程 ID，并提取执行该流程所需的上下文参数。

【已认证业务流程库 (可用 SOP 列表)】：
{flow_catalog_json}

【匹配协议规范】：
如果你成功在上面的库中找到了合适的 SOP，请严格输出以下 JSON 格式（必须且只能包裹在 ```json 和 ``` 之间）：
{
  "intent_type": "MATCH_SOP",
  "flow_id": "你匹配到的流程ID（必须完全等同于库中的 id）",
  "flow_name": "你匹配到的流程名称",
  "confidence": 0.95,
  "extracted_params": {
    "变量名1": "从用户输入中提取的值，如公司名、目标邮箱等"
  },
  "reply_msg": "给用户的回复话术，说明你找到了这个流程并准备执行"
}

【严禁触碰的红线】：
1. 绝对不允许自行捏造、创造任何不存在的 flow_id。你只能从【已认证业务流程库】中挑选。
2. 如果用户的意图与库中所有流程都不匹配，或者库是空的，请直接用自然语言回复：“抱歉，在系统的已认证资产库中没有找到对应的 SOP，无法为您执行。请联系架构师在 Studio 中设计并导入该流程。”，绝对不要输出 JSON。
"""

def process_chat_intent(user_input: str) -> dict:
    """
    意图匹配引擎：从现有的 Flows 资产库中寻找最佳匹配，并提取执行参数。
    """
    print(f"\n🔍 [Intent Router] 正在分析用户意图并匹配底层资产图纸: '{user_input}'")
    
    # 1. 动态读取当前系统里真实存在的、由架构师画好并保存的图纸目录
    existing_flows = FileStorage.list_all("flows")
    
    # 构建精简的目录索引，喂给大模型做选择题（避免把几十 MB 的图纸节点全塞进 Prompt 撑爆 Token）
    flow_catalog = [
        {
            "id": f.get("id"), 
            "name": f.get("name"), 
            "description": f.get("description", "无描述，请根据名称推测意图")
        }
        for f in existing_flows
    ]
    
    # 2. 将真实的目录索引作为上下文，动态注入给 System Prompt
    system_prompt = MASTER_ROUTER_PROMPT.replace(
        "{flow_catalog_json}", 
        json.dumps(flow_catalog, ensure_ascii=False, indent=2)
    )
    
    # 3. 呼叫大模型进行语义路由与参数抽取
    response_text = ask_llm(prompt=user_input, system_prompt=system_prompt)
    
    # 4. 解析匹配结果
    if "```json" in response_text:
        try:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
            match_data = json.loads(json_str)
            
            # 🚨 终极安全校验：防止大模型幻觉！
            # 必须确保大模型返回的 flow_id 真实存在于我们刚才查出来的 existing_flows 列表中
            matched_flow = next((f for f in existing_flows if f["id"] == match_data.get("flow_id")), None)
            
            if matched_flow:
                print(f"✅ [Intent Router] 成功匹配到企业资产流程: {matched_flow['name']} ({matched_flow['id']})")
                
                return {
                    "type": "COMPLEX_TASK",
                    "message": match_data.get("reply_msg", f"已为您匹配到标准化作业流程：**{matched_flow['name']}**。您可以点击下方卡片审查或一键载入执行。"),
                    # 构造前端渲染卡片所需的数据结构
                    "sop_data": {
                        "sop_name": matched_flow["name"],
                        "extracted_params": match_data.get("extracted_params", {})
                    },
                    "flow_id": matched_flow["id"]
                }
            else:
                # 触发了幻觉：大模型输出了 JSON，但是捏造了一个不存在的 ID
                print(f"⚠️ [Intent Router] 拦截到模型幻觉：捏造了不存在的 flow_id {match_data.get('flow_id')}")
                return {
                    "type": "GENERAL_CHAT", 
                    "message": "抱歉，虽然我理解了您的需求，但在系统的已认证资产库中没有找到对应的标准操作流 (SOP)，无法为您执行。"
                }
                 
        except Exception as e:
            err_msg = f"❌ [Intent Router] 解析路由指令失败: {e}"
            print(err_msg)
            return {"type": "GENERAL_CHAT", "message": f"我在尝试匹配流程时遇到了内部错误，请稍后再试。\n(详情: {str(e)})"}
            
    else:
        # 大模型认为这只是闲聊，没有输出 JSON 块
        print("💬 [Intent Router] 识别为普通交互，未触发 SOP 匹配。")
        return {"type": "GENERAL_CHAT", "message": response_text}