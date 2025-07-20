#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试Selenium解析器
"""

import sys
import time

def test_selenium_parser():
    """测试Selenium解析器"""
    print("开始测试Selenium解析器...")
    
    try:
        # 导入解析器
        from douyin_selenium_parser import parse_douyin_with_selenium, cleanup_parser
        
        # 测试URL
        test_url = "https://v.douyin.com/uH0I8F3V92Q/"
        
        print(f"测试URL: {test_url}")
        print("开始解析...")
        
        # 开始计时
        start_time = time.time()
        
        # 解析视频
        result = parse_douyin_with_selenium(test_url)
        
        # 结束计时
        end_time = time.time()
        
        print(f"解析耗时: {end_time - start_time:.2f}秒")
        print(f"解析结果: {result}")
        
        # 检查结果
        if result.get('video_url'):
            print("✅ 解析成功！")
            print(f"视频链接: {result['video_url']}")
            print(f"标题: {result.get('title', 'N/A')}")
            print(f"作者: {result.get('author', 'N/A')}")
        else:
            print("❌ 解析失败")
            if result.get('error'):
                print(f"错误信息: {result['error']}")
        
        # 清理资源
        cleanup_parser()
        
        return result
        
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        print("请确保已安装 selenium 和 webdriver-manager")
        return None
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return None

def test_chrome_installation():
    """测试Chrome浏览器安装"""
    print("检查Chrome浏览器...")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        from webdriver_manager.chrome import ChromeDriverManager
        
        print("✅ Selenium模块导入成功")
        
        # 测试ChromeDriver下载
        print("下载ChromeDriver...")
        driver_path = ChromeDriverManager().install()
        print(f"✅ ChromeDriver路径: {driver_path}")
        
        # 测试Chrome启动
        print("测试Chrome启动...")
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("✅ Chrome启动成功")
        
        # 测试访问网页
        driver.get("https://www.baidu.com")
        title = driver.title
        print(f"✅ 网页访问成功，标题: {title}")
        
        # 关闭浏览器
        driver.quit()
        print("✅ Chrome关闭成功")
        
        return True
        
    except Exception as e:
        print(f"❌ Chrome测试失败: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Selenium解析器测试")
    print("=" * 50)
    
    # 测试Chrome安装
    chrome_ok = test_chrome_installation()
    
    if chrome_ok:
        print("\n" + "=" * 50)
        # 测试解析器
        result = test_selenium_parser()
        
        if result and result.get('video_url'):
            print("\n🎉 所有测试通过！Selenium解析器可以正常工作。")
        else:
            print("\n⚠️ 解析器测试失败，但Chrome环境正常。")
    else:
        print("\n❌ Chrome环境测试失败，请检查Chrome浏览器安装。")
    
    print("\n" + "=" * 50) 