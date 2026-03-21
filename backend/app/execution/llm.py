import os
from litellm import completion
from app.core.storage import FileStorage

def ask_llm(prompt: str, system_prompt: str = None, model_id: str = None) -> str:
    """
    统一的 LLM 调用网关：动态从 FileDB 读取真实的 API Key。
    如果没有指定 model_id，自动寻找系统中第一个配置了真实 Key 的模型！
    """
    api_key = None
    actual_model = model_id
    
    # 1. 获取所有配置了真实 Key（不包含 xxxx）的模型
    all_models = FileStorage.list_all("models")
    active_models = [m for m in all_models if m.get("api_key") and "xxxx" not in m.get("api_key")]
    
    if not active_models:
        return "❌ 没有任何有效的模型配置，请先在 Model Hub 中填入真实的 API Key。"

    # 2. 如果没指定模型，或者指定的模型没配置 Key，自动 fallback 到第一个可用的模型
    if not actual_model:
        actual_model = active_models[0]["id"]
        api_key = active_models[0]["api_key"]
    else:
        target = next((m for m in active_models if m["id"] == actual_model), None)
        if target:
            api_key = target["api_key"]
        else:
            # Fallback
            actual_model = active_models[0]["id"]
            api_key = active_models[0]["api_key"]

    # 3. 💡 兼容 LiteLLM 的特殊前缀 (DeepSeek 等需要特定前缀)
    litellm_model_name = actual_model
    if "deepseek" in actual_model.lower() and "/" not in actual_model:
        litellm_model_name = f"deepseek/{actual_model}"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    try:
        print(f"🧠 [Model Hub] 自动路由，正在使用模型: {litellm_model_name} ...")
        response = completion(
            model=litellm_model_name,
            messages=messages,
            api_key=api_key, 
            temperature=0.1,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ [Model Hub] 模型调用失败: {e}")
        return f"Error: {str(e)}"