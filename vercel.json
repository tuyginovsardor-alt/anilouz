import requests
import sys

URL = "http://api.anilo.uz/"

def test_api():
    try:
        response = requests.get(URL)
        if response.status_code == 200:
            print(f"✅ Backend URL ishlayapti: {response.json()}")
        else:
            print(f"❌ Backend xatosi: {response.status_code}")
    except Exception as e:
        print(f"❌ Ulanib bo'lmadi: {str(e)}")

if __name__ == "__main__":
    test_api()
