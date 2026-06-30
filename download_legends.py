import urllib.request
import json
import os
import time

titles = "Magnus_Carlsen|Garry_Kasparov|Bobby_Fischer|Viswanathan_Anand|Judit_Polg%C3%A1r|Anatoly_Karpov|Mikhail_Tal|Jos%C3%A9_Ra%C3%BAl_Capablanca|Wilhelm_Steinitz"
url = f"https://en.wikipedia.org/w/api.php?action=query&titles={titles}&prop=pageimages&format=json&pithumbsize=600"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())

os.makedirs("d:/Html/Chess/legends", exist_ok=True)

for p in data['query']['pages'].values():
    title = p['title'].replace(' ', '_')
    if os.path.exists(f"d:/Html/Chess/legends/{title}.jpg"):
        print(f"Skipping {title}")
        continue
    if 'thumbnail' in p:
        img_url = p['thumbnail']['source']
        print(f"Downloading {title}")
        img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10._15_7)'})
        try:
            with urllib.request.urlopen(img_req) as img_resp:
                with open(f"d:/Html/Chess/legends/{title}.jpg", 'wb') as f:
                    f.write(img_resp.read())
            time.sleep(2)  # Delay to avoid 429
        except Exception as e:
            print(f"Failed {title}: {e}")
    else:
        print(f"No img for {title}")
