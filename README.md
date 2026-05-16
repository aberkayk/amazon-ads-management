# Amazon Ads MCP — Claude Code Integration

---

## TÜRKÇE

### Mimari ve Güvenlik Özeti

API şifreleriniz (`Client Secret`, `Refresh Token`) bilgisayarınızda yerel bir `.env` dosyasında tutulur. Python tabanlı yerel bir MCP sunucusu bu şifreleri okuyarak Claude Code'un Amazon Ads v3 API'siyle güvenli biçimde iletişim kurmasını sağlar.

---

### BÖLÜM 1: Amazon Geliştirici Konsolu & İzin Ayarları

1. **Amazon Developer Console**'a giriş yapın, **Login with Amazon (LwA)** ayarlarına gidin.
2. API için kullandığınız güvenlik profilinin **Web Settings** bölümüne gelin.
3. **Allowed Return URLs** kısmına şu adresi ekleyip kaydedin:
   ```
   https://localhost:9090
   ```
4. **Amazon Ads Developer Console**'da uygulamanızın yanındaki **Assign Scopes** butonuna tıklayın ve `advertising::campaign_management` iznini açıkça ekleyin.

---

### BÖLÜM 2: Kalıcı Refresh Token ve Profile ID Alımı

> **🔁 Tekrarlanacak Adımlar**
> Refresh Token süresi dolduğunda veya yeni bir yetkilendirme gerektiğinde **Adım 1 ve 2**'yi tekrarlayın. Profile ID değişmez, yalnızca bir kez alınır.

**Adım 1 — Yetkilendirme Kodu Alma (5 dakika geçerlidir)**

Aşağıdaki URL'yi kendi `CLIENT_ID`'niz ile güncelleyerek tarayıcıda açın:

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

Giriş yapıp onay verdikten sonra sayfa kırılacaktır. Adres çubuğundaki URL'den `code=` parametresini kopyalayın:

```
Örnek: https://localhost:9090/?code=ANqQnRSDhXCSdUfrHqAJ&scope=...
```

> ⚠️ Bu kodun ömrü **5 dakikadır**. Süresi dolarsa bu adımı tekrarlayın.

---

**Adım 2 — Refresh Token Üretme**

Terminalinizde aşağıdaki komutu kendi bilgilerinizle doldurup çalıştırın:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code" \
  -d "code=ALDIGINIZ_5_DAKIKALIK_KOD" \
  -d "redirect_uri=https://localhost:9090" \
  -d "client_id=UYGULAMA_CLIENT_ID" \
  -d "client_secret=UYGULAMA_CLIENT_SECRET"
```

Gelen JSON yanıtındaki `refresh_token` (`Atzr|` ile başlar) değerini `.env` dosyanıza kaydedin.

---

**Adım 3 — Profile ID Alma (Yalnızca bir kez)**

Yukarıdaki yanıttan gelen geçici `access_token` ile şu isteği atın:

```bash
curl -H "Amazon-Advertising-API-ClientId: UYGULAMA_CLIENT_ID" \
     -H "Authorization: Bearer GECICI_ACCESS_TOKEN" \
     https://advertising-api.amazon.com/v2/profiles
```

Yanıttaki 9 haneli `profileId` değerini `.env` dosyanıza kaydedin.

---

### BÖLÜM 3: Geliştirme Ortamı & Bağımlılıklar

MCP sunucuları en az Python 3.10 gerektirir:

```bash
# Güncel Python kurulumu
brew install python

# Proje klasörünü oluşturma
mkdir -p ~/Projects/amazon-claude-mcp
cd ~/Projects/amazon-claude-mcp

# Bağımlılıkların kurulumu
/opt/homebrew/bin/pip3 install mcp requests python-dotenv --break-system-packages
```

---

### BÖLÜM 4: Proje Dosyalarının Hazırlanması

**`.env` Dosyası**

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client...
AMAZON_CLIENT_SECRET=lwa_secret_bilginiz...
AMAZON_REFRESH_TOKEN=Atzr|kalici_refresh_tokeniniz...
AMAZON_PROFILE_ID=9_haneli_profil_numaraniz
```

> Güvenlik için: Aynı klasörde bir `.gitignore` dosyası oluşturun ve içine `.env` yazın.

---

### BÖLÜM 5: Claude Code Entegrasyonu

```bash
claude mcp add amazon-ads-mcp /opt/homebrew/bin/python3 -- /Users/KULLANICI_ADINIZ/Projects/amazon-claude-mcp/ads_server.py
```

`.env` dosyasını güncellediyseniz Claude'dan `exit` ile çıkıp yeniden başlatın veya `/mcp reload amazon-ads-mcp` komutunu kullanın.

---

### BÖLÜM 6: Kullanım Örnekleri

- "Amazon Ads MCP aracını kullanarak aktif reklam kampanyalarımı listeler misin?"
- "Reklam kampanyalarımın bütçe durumlarını kontrol edip özetle."

---

---

## ENGLISH

### Architecture & Security Summary

Your sensitive credentials (`Client Secret`, `Refresh Token`) are stored locally in a `.env` file on your machine. A Python-based local MCP server reads these credentials and securely bridges Claude Code with the official Amazon Ads v3 API.

---

### SECTION 1: Amazon Developer Console & Scope Assignment

1. Log in to the **Amazon Developer Console** and navigate to **Login with Amazon (LwA)** settings.
2. Go to the **Web Settings** tab of the Security Profile you use for API access.
3. Under **Allowed Return URLs**, add the following URL and save:
   ```
   https://localhost:9090
   ```
4. In the **Amazon Ads Developer Console**, click **Assign Scopes** next to your application and explicitly grant the `advertising::campaign_management` permission.

---

### SECTION 2: Obtaining a Permanent Refresh Token & Profile ID

> **🔁 Repeatable Steps**
> When your Refresh Token expires or a new authorization is required, repeat **Steps 1 and 2** below. The Profile ID is permanent and only needs to be fetched once.

**Step 1 — Get an Authorization Code (valid for 5 minutes)**

Open the following URL in your browser, replacing `YOUR_CLIENT_ID` with your actual Client ID:

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

After logging in and granting access, the page will fail to load (localhost:9090 is unreachable by design). Copy the full URL from your browser's address bar and extract the `code=` value:

```
Example: https://localhost:9090/?code=ANqQnRSDhXCSdUfrHqAJ&scope=...
```

> ⚠️ This code expires in **5 minutes**. If it expires, repeat this step.

---

**Step 2 — Exchange the Code for a Permanent Refresh Token**

Run the following command in your terminal with your actual credentials:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_5_MINUTE_CODE" \
  -d "redirect_uri=https://localhost:9090" \
  -d "client_id=YOUR_LWA_CLIENT_ID" \
  -d "client_secret=YOUR_LWA_CLIENT_SECRET"
```

From the JSON response, copy the `refresh_token` value (starts with `Atzr|`) and save it to your `.env` file.

---

**Step 3 — Fetch the Advertising Profile ID (one-time only)**

Using the temporary `access_token` from the previous response, run:

```bash
curl -H "Amazon-Advertising-API-ClientId: YOUR_LWA_CLIENT_ID" \
     -H "Authorization: Bearer YOUR_TEMPORARY_ACCESS_TOKEN" \
     https://advertising-api.amazon.com/v2/profiles
```

Save the 9-digit `profileId` from the response to your `.env` file.

---

### SECTION 3: Environment Setup & Dependencies

MCP servers require Python 3.10 or higher:

```bash
# Install the latest stable Python
brew install python

# Create the project directory
mkdir -p ~/Projects/amazon-claude-mcp
cd ~/Projects/amazon-claude-mcp

# Install dependencies
/opt/homebrew/bin/pip3 install mcp requests python-dotenv --break-system-packages
```

---

### SECTION 4: Creating Project Files

**`.env` File**

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client...
AMAZON_CLIENT_SECRET=your_lwa_client_secret...
AMAZON_REFRESH_TOKEN=Atzr|your_permanent_refresh_token...
AMAZON_PROFILE_ID=your_9_digit_profile_id
```

> Security: Create a `.gitignore` file in the same directory and add `.env` to prevent accidental credential leaks.

---

### SECTION 5: Linking to Claude Code

```bash
claude mcp add amazon-ads-mcp /opt/homebrew/bin/python3 -- /Users/YOUR_USERNAME/Projects/amazon-claude-mcp/ads_server.py
```

If you updated the `.env` file, type `exit` to close Claude and restart it, or run `/mcp reload amazon-ads-mcp` from within Claude.

---

### SECTION 6: Example Prompts

- "Can you list my active Amazon advertising campaigns using the Amazon Ads MCP tool?"
- "Analyze the budget status of my campaigns and summarize them."
