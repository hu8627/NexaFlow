from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ==========================================
# 0. 基础枚举类型 (Enums)
# ==========================================
class ComponentType(str, Enum):
    ACTION = "action"   # 动作：如 browser-use 点击、输入、API调用
    JUDGE = "judge"     # 判断：如 LLM 视觉判断是否出现验证码
    RECORD = "record"   # 记录：如 将提取的客户信息写入上下文
    NOTIFY = "notify"   # 通知：如 发送通知

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUSPENDED = "suspended" # 挂起（触发Auditor，等待人工介入）
    COMPLETED = "completed"
    FAILED = "failed"

# ==========================================
# 1. 定义态 (Definition Plane) - BPNL核心协议
# ==========================================
class ComponentSchema(BaseModel):
    step_id: str
    type: ComponentType
    tool_name: str = Field(..., description="底层调用的工具名，如 'browser_click', 'vision_llm'")
    params: Dict[str, Any] = Field(default_factory=dict, description="工具参数，如 {'xpath': '...', 'text': '...'}")

class NodeSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    components: List[ComponentSchema] = Field(default_factory=list, description="节点内按顺序执行的原子动作")
    # PNSA 控制参数
    max_retries: int = Field(default=3, description="最大重试次数")
    interrupt_before: bool = Field(default=False, description="Auditor 机制：执行该节点前是否强制人工确认")
    ui_position: Dict[str, float] = Field(default={"x": 0, "y": 0}, description="前端画布坐标")

class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    condition: Optional[str] = Field(None, description="Supervisor 路由条件表达式，如 'retry_count < 3'")
    label: Optional[str] = None

class FlowSchema(BaseModel):
    id: str
    name: str
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]

class RouteRule(BaseModel):
    condition: str = Field(..., description="规则表达式，如 'country == CN'")
    target_flow_id: str

class SceneSchema(BaseModel):
    id: str
    name: str = Field(..., description="场景域，如 'B2B销售拓客'")
    routes: List[RouteRule] = Field(default_factory=list, description="场景内的入口路由策略")

class IntentSchema(BaseModel):
    id: str
    description: str = Field(..., description="自然语言意图描述，如 '调研Shopify并录入CRM'")
    target_scene_id: str

# ==========================================
# 2. 运行态 (Runtime Plane) - 追踪与执行
# ==========================================
class TraceLog(BaseModel):
    trace_id: str
    node_id: str
    step_id: str
    status: str
    snapshot_url: Optional[str] = Field(None, description="如果是Browser操作，记录当时的屏幕截图/DOM快照")
    logs: str

class TaskState(BaseModel):
    task_id: str
    flow_id: str
    status: TaskStatus
    current_node_id: Optional[str]
    context_data: Dict[str, Any] = Field(default_factory=dict, description="任务全局记忆（如提取到的客户姓名、邮箱）")
    traces: List[TraceLog] = Field(default_factory=list)

# ==========================================
# 3. 治理态 (Governance Plane) - 闭环与进化
# ==========================================
class InterventionRecord(BaseModel):
    """
    自进化核心：人类接管记录 (Case Ledger)
    """
    record_id: str
    task_id: str
    node_id: str
    failed_reason: str = Field(..., description="AI 为何挂起？如 '找不到保存按钮'")
    state_before_snapshot: str = Field(..., description="人类接管前的视觉快照/DOM树")
    human_action: Dict[str, Any] = Field(..., description="人类实际的操作，如 {'action': 'click', 'xpath': '...', 'x': 120, 'y': 340}")
    created_at: str