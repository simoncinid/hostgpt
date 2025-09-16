#!/usr/bin/env python3
"""
Test script per verificare che Docker e Playwright funzionino
"""
import os
import sys

def test_playwright():
    """Test se Playwright funziona"""
    try:
        from playwright.async_api import async_playwright
        print("✅ Playwright importato correttamente")
        
        # Test se i browser sono installati
        import asyncio
        
        async def test_browser():
            async with async_playwright() as p:
                try:
                    browser = await p.chromium.launch(headless=True)
                    print("✅ Browser Chromium lanciato correttamente")
                    await browser.close()
                    return True
                except Exception as e:
                    print(f"❌ Errore browser: {e}")
                    return False
        
        result = asyncio.run(test_browser())
        return result
        
    except ImportError as e:
        print(f"❌ Playwright non installato: {e}")
        return False
    except Exception as e:
        print(f"❌ Errore Playwright: {e}")
        return False

def test_environment():
    """Test variabili d'ambiente"""
    print(f"🐍 Python version: {sys.version}")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🐳 Docker environment: {os.getenv('DOCKER', 'No')}")
    print(f"🌐 Render environment: {os.getenv('RENDER', 'No')}")
    print(f"🎭 Playwright browsers path: {os.getenv('PLAYWRIGHT_BROWSERS_PATH', 'Default')}")

if __name__ == "__main__":
    print("🧪 Test Docker e Playwright")
    print("=" * 50)
    
    test_environment()
    print()
    
    if test_playwright():
        print("🎉 TUTTO FUNZIONA! Playwright è configurato correttamente.")
    else:
        print("💥 PROBLEMA! Playwright non funziona.")
        sys.exit(1)
