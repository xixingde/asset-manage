from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
from datetime import datetime

app = FastAPI(title="资产管理系统", description="资产数据CRUD操作API")

# 资产数据模型
class Asset(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    value: float
    purchase_date: str
    description: Optional[str] = None

class AssetCreate(BaseModel):
    name: str
    category: str
    value: float
    purchase_date: str
    description: Optional[str] = None

# 数据库初始化
def init_database():
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            value REAL NOT NULL,
            purchase_date TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# 启动时初始化数据库
@app.on_event("startup")
async def startup_event():
    init_database()

# 静态文件服务
app.mount("/static", StaticFiles(directory="static"), name="static")

# 根路径返回HTML页面
@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

# 表格页面路由
@app.get("/table")
async def table_view():
    return FileResponse('static/table.html')

# 数据统计面板路由
@app.get("/dashboard")
async def dashboard_view():
    return FileResponse('static/dashboard.html')

# 获取所有资产
@app.get("/api/assets", response_model=List[Asset])
async def get_assets():
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, category, value, purchase_date, description FROM assets")
    assets = []
    for row in cursor.fetchall():
        assets.append(Asset(
            id=row[0],
            name=row[1],
            category=row[2],
            value=row[3],
            purchase_date=row[4],
            description=row[5]
        ))
    conn.close()
    return assets

# 根据ID获取资产
@app.get("/api/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: int):
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, category, value, purchase_date, description FROM assets WHERE id = ?", (asset_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        raise HTTPException(status_code=404, detail="资产未找到")
    
    return Asset(
        id=row[0],
        name=row[1],
        category=row[2],
        value=row[3],
        purchase_date=row[4],
        description=row[5]
    )

# 创建新资产
@app.post("/api/assets", response_model=Asset)
async def create_asset(asset: AssetCreate):
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO assets (name, category, value, purchase_date, description) VALUES (?, ?, ?, ?, ?)",
        (asset.name, asset.category, asset.value, asset.purchase_date, asset.description)
    )
    asset_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return Asset(
        id=asset_id,
        name=asset.name,
        category=asset.category,
        value=asset.value,
        purchase_date=asset.purchase_date,
        description=asset.description
    )

# 更新资产
@app.put("/api/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: int, asset: AssetCreate):
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    
    # 检查资产是否存在
    cursor.execute("SELECT id FROM assets WHERE id = ?", (asset_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="资产未找到")
    
    # 更新资产
    cursor.execute(
        "UPDATE assets SET name = ?, category = ?, value = ?, purchase_date = ?, description = ? WHERE id = ?",
        (asset.name, asset.category, asset.value, asset.purchase_date, asset.description, asset_id)
    )
    conn.commit()
    conn.close()
    
    return Asset(
        id=asset_id,
        name=asset.name,
        category=asset.category,
        value=asset.value,
        purchase_date=asset.purchase_date,
        description=asset.description
    )

# 删除资产
@app.delete("/api/assets/{asset_id}")
async def delete_asset(asset_id: int):
    conn = sqlite3.connect('assets.db')
    cursor = conn.cursor()
    
    # 检查资产是否存在
    cursor.execute("SELECT id FROM assets WHERE id = ?", (asset_id,))
    if cursor.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="资产未找到")
    
    # 删除资产
    cursor.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
    conn.commit()
    conn.close()
    
    return {"message": "资产删除成功"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)