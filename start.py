#!/usr/bin/env python3
"""
资产管理系统启动脚本
Asset Management System Startup Script
"""

import subprocess
import sys
import os

def check_requirements():
    """检查并安装依赖"""
    print("正在检查依赖包...")
    
    try:
        import fastapi
        import uvicorn
        import pydantic
        import sqlalchemy
        print("✓ 所有依赖包已安装")
    except ImportError as e:
        print(f"✗ 缺少依赖包: {e}")
        print("正在安装依赖包...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✓ 依赖包安装完成")
        except subprocess.CalledProcessError:
            print("✗ 依赖包安装失败，请手动运行: pip install -r requirements.txt")
            return False
    
    return True

def start_server():
    """启动FastAPI服务器"""
    print("\n正在启动资产管理系统...")
    print("服务器地址: http://localhost:8000")
    print("按 Ctrl+C 停止服务器\n")
    
    try:
        import uvicorn
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"启动服务器时出错: {e}")

def main():
    """主函数"""
    print("=" * 50)
    print("资产管理系统")
    print("Asset Management System")
    print("=" * 50)
    
    # 检查当前目录
    if not os.path.exists("main.py"):
        print("✗ 未找到 main.py 文件，请确保在正确的目录中运行此脚本")
        return
    
    if not os.path.exists("static"):
        print("✗ 未找到 static 目录，请确保项目文件完整")
        return
    
    # 检查依赖
    if not check_requirements():
        return
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()