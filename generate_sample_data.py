#!/usr/bin/env python3
"""
生成样例数据脚本
Generate Sample Data Script
"""

import requests
import json
from datetime import datetime, timedelta
import random

# 样例数据
SAMPLE_ASSETS = [
    # 电子设备
    {
        "name": "MacBook Pro 16英寸",
        "category": "电子设备",
        "value": 18999.00,
        "purchase_date": "2023-03-15",
        "description": "开发团队主力笔记本电脑，M2 Pro芯片，32GB内存，1TB存储"
    },
    {
        "name": "iPhone 15 Pro",
        "category": "电子设备", 
        "value": 8999.00,
        "purchase_date": "2024-09-20",
        "description": "公司配发手机，钛金属材质，256GB存储容量"
    },
    {
        "name": "戴尔显示器 32英寸 4K",
        "category": "电子设备",
        "value": 3299.00,
        "purchase_date": "2023-08-10",
        "description": "专业级4K显示器，支持USB-C一线连接，色彩准确度99% sRGB"
    },
    {
        "name": "索尼WH-1000XM5耳机",
        "category": "电子设备",
        "value": 2399.00,
        "purchase_date": "2024-01-20",
        "description": "降噪耳机，30小时续航，支持多点连接"
    },
    {
        "name": "iPad Pro 12.9英寸",
        "category": "电子设备",
        "value": 8799.00,
        "purchase_date": "2024-05-15",
        "description": "M2芯片，512GB存储，配Apple Pencil和妙控键盘"
    },
    
    # 办公用品
    {
        "name": "Herman Miller人体工学椅",
        "category": "办公用品",
        "value": 8500.00,
        "purchase_date": "2023-02-28",
        "description": "Aeron经典款，全功能调节，12年质保"
    },
    {
        "name": "升降办公桌",
        "category": "办公用品",
        "value": 2800.00,
        "purchase_date": "2023-03-05",
        "description": "电动升降，记忆高度设置，环保板材，150cm×80cm"
    },
    {
        "name": "激光打印机",
        "category": "办公用品",
        "value": 1299.00,
        "purchase_date": "2024-02-10",
        "description": "惠普LaserJet Pro，双面打印，无线连接，月打印量3000页"
    },
    {
        "name": "文档粉碎机",
        "category": "办公用品",
        "value": 899.00,
        "purchase_date": "2024-06-01",
        "description": "4级保密，可粉碎信用卡和光盘，22L大容量"
    },
    {
        "name": "会议白板",
        "category": "办公用品",
        "value": 450.00,
        "purchase_date": "2023-11-15",
        "description": "磁性白板，120cm×90cm，配套彩色白板笔和板擦"
    },
    
    # 车辆
    {
        "name": "特斯拉Model Y",
        "category": "车辆",
        "value": 263900.00,
        "purchase_date": "2024-01-08",
        "description": "长续航版，双电机全轮驱动，自动驾驶功能，公司商务用车"
    },
    {
        "name": "丰田凯美瑞",
        "category": "车辆",
        "value": 189800.00,
        "purchase_date": "2022-09-12",
        "description": "2.5L混动版，燃油经济性优秀，适合日常通勤"
    },
    {
        "name": "宝马X3",
        "category": "车辆",
        "value": 389900.00,
        "purchase_date": "2023-06-20",
        "description": "xDrive25i豪华套装，全景天窗，自适应巡航，高管专用"
    },
    
    # 房产
    {
        "name": "办公楼A座10层",
        "category": "房产",
        "value": 12800000.00,
        "purchase_date": "2021-03-01",
        "description": "总部办公楼，使用面积1200平米，地理位置优越，配套设施完善"
    },
    {
        "name": "仓储中心",
        "category": "房产",
        "value": 3600000.00,
        "purchase_date": "2022-11-30",
        "description": "物流仓储基地，面积5000平米，配备现代化仓储设备"
    },
    
    # 家具
    {
        "name": "实木会议桌",
        "category": "家具",
        "value": 15800.00,
        "purchase_date": "2023-01-18",
        "description": "胡桃木材质，可容纳12人，配套真皮会议椅"
    },
    {
        "name": "接待沙发组合",
        "category": "家具",
        "value": 8900.00,
        "purchase_date": "2023-04-22",
        "description": "意式真皮沙发，1+2+3组合，颜色经典商务黑"
    },
    {
        "name": "文件储物柜",
        "category": "家具",
        "value": 1200.00,
        "purchase_date": "2024-03-10",
        "description": "钢制文件柜，4门设计，防火防潮，安全锁具"
    },
    {
        "name": "前台接待台",
        "category": "家具",
        "value": 4500.00,
        "purchase_date": "2023-02-15",
        "description": "现代简约设计，钢化玻璃台面，LED灯带装饰"
    },
    
    # 其他
    {
        "name": "空气净化器",
        "category": "其他",
        "value": 2899.00,
        "purchase_date": "2024-04-18",
        "description": "HEPA滤网，适用面积60平米，智能控制，静音运行"
    },
    {
        "name": "咖啡机",
        "category": "其他",
        "value": 4200.00,
        "purchase_date": "2023-12-08",
        "description": "意式全自动咖啡机，内置磨豆机，多种咖啡模式"
    },
    {
        "name": "监控摄像头系统",
        "category": "其他",
        "value": 8600.00,
        "purchase_date": "2023-05-30",
        "description": "16路监控系统，4K高清，夜视功能，远程监控"
    },
    {
        "name": "UPS不间断电源",
        "category": "其他",
        "value": 3500.00,
        "purchase_date": "2024-07-12",
        "description": "3000VA容量，在线式设计，保护服务器等重要设备"
    }
]

def create_sample_assets():
    """创建样例资产数据"""
    base_url = "http://localhost:8000/api/assets"
    
    print("🚀 开始生成样例数据...")
    print("=" * 50)
    
    created_count = 0
    failed_count = 0
    
    for i, asset_data in enumerate(SAMPLE_ASSETS, 1):
        try:
            response = requests.post(base_url, json=asset_data)
            
            if response.status_code == 200:
                created_asset = response.json()
                created_count += 1
                print(f"✅ [{i:2d}] 成功创建: {asset_data['name']} - {asset_data['category']} - ¥{asset_data['value']:,.2f}")
            else:
                failed_count += 1
                print(f"❌ [{i:2d}] 创建失败: {asset_data['name']} - 错误: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ 连接失败! 请确保服务器正在运行 (python start.py)")
            return False
        except Exception as e:
            failed_count += 1
            print(f"❌ [{i:2d}] 创建失败: {asset_data['name']} - 错误: {str(e)}")
    
    print("=" * 50)
    print(f"📊 数据生成完成!")
    print(f"✅ 成功创建: {created_count} 个资产")
    if failed_count > 0:
        print(f"❌ 失败: {failed_count} 个资产")
    
    print("\n🌟 样例数据统计:")
    category_stats = {}
    total_value = 0
    
    for asset in SAMPLE_ASSETS:
        category = asset['category']
        if category not in category_stats:
            category_stats[category] = {'count': 0, 'value': 0}
        category_stats[category]['count'] += 1
        category_stats[category]['value'] += asset['value']
        total_value += asset['value']
    
    for category, stats in category_stats.items():
        print(f"  📁 {category}: {stats['count']}个 - ¥{stats['value']:,.2f}")
    
    print(f"\n💰 总资产价值: ¥{total_value:,.2f}")
    print(f"📈 平均资产价值: ¥{total_value/len(SAMPLE_ASSETS):,.2f}")
    
    print(f"\n🌐 访问系统:")
    print(f"  🏠 主页面 (卡片视图): http://localhost:8000")
    print(f"  📋 表格检索页面: http://localhost:8000/table")
    print(f"  📊 数据统计面板: http://localhost:8000/dashboard")
    print(f"  📚 API文档: http://localhost:8000/docs")
    
    return True

def check_server_status():
    """检查服务器状态"""
    try:
        response = requests.get("http://localhost:8000/api/assets")
        return response.status_code == 200
    except:
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("🎯 资产管理系统 - 样例数据生成器")
    print("Asset Management System - Sample Data Generator")
    print("=" * 60)
    
    # 检查服务器状态
    if not check_server_status():
        print("❌ 错误: 无法连接到服务器!")
        print("💡 请先启动服务器: python start.py")
        print("🔗 然后在新终端运行: python generate_sample_data.py")
        return
    
    print("✅ 服务器连接正常")
    
    # 询问用户确认
    print(f"\n📝 将要创建 {len(SAMPLE_ASSETS)} 个样例资产:")
    for category, count in [(cat, len([a for a in SAMPLE_ASSETS if a['category'] == cat])) 
                           for cat in set(a['category'] for a in SAMPLE_ASSETS)]:
        print(f"  • {category}: {count}个")
    
    confirm = input(f"\n❓ 确认生成样例数据吗? (y/N): ").strip().lower()
    
    if confirm in ['y', 'yes', '是', 'Y']:
        success = create_sample_assets()
        if success:
            print(f"\n🎉 样例数据生成完成! 现在您可以体验完整的资产管理系统功能。")
        else:
            print(f"\n💥 样例数据生成遇到问题，请检查服务器状态。")
    else:
        print("📝 操作已取消")

if __name__ == "__main__":
    main()