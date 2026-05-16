# Amazon Ads MCP

Amazon Sponsored Products verilerini Claude ve terminal üzerinden analiz etmek için MCP sunucusu ve optimizasyon agentları.

---

## Kurulum

**1. Bağımlılıkları yükle**

```bash
pip install -r requirements.txt
```

**2. Ortam değişkenlerini ayarla**

`.env` dosyası oluştur:

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=amzn1.oa2-cs.v1.xxx
AMAZON_REFRESH_TOKEN=Atzr|xxx
AMAZON_PROFILE_ID=1234567890
ANTHROPIC_API_KEY=sk-ant-xxx
```

**3. Refresh Token Al** *(süresi dolduğunda tekrarlayın)*

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

Giriş sonrası `code=` değerini kopyalayın, ardından token alın:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code" \
  -d "code=ALDIGINIZ_KOD" \
  -d "redirect_uri=https://localhost:9090" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET"
```

---

## MCP Sunucusu

Claude Desktop veya Claude Code ile kullanmak için `ads_server.py`'yi MCP sunucusu olarak ekle:

```bash
python ads_server.py
```

---

## Optimizasyon Agentları

Kampanya verilerini analiz edip Markdown rapor üretir:

```bash
python agents/run.py
```

Rapor `agents/reports/YYYY-MM-DD-recommendations.md` olarak kaydedilir.

### Agent'lar

| Agent | Analiz Alanı |
|-------|-------------|
| `bid_agent` | ACoS/ROAS bazlı teklif optimizasyonu |
| `keyword_agent` | Keyword duraklatma, negatif ekleme, yeni öneri |
| `budget_agent` | Kampanya bütçe yeniden dağılımı |
| `searchterm_agent` | Search term → keyword/negatif dönüşüm önerileri |
