# Amazon Ads MCP

Amazon Sponsored Products verilerini Claude üzerinden analiz etmek ve optimize etmek için MCP sunucusu.
API anahtarı gerekmez — Claude hesabın üzerinden çalışır.

---

## Kurulum

```bash
pip install -r requirements.txt
```

`.env` dosyası:

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=amzn1.oa2-cs.v1.xxx
AMAZON_REFRESH_TOKEN=Atzr|xxx
AMAZON_PROFILE_ID=1234567890
```

**Refresh Token almak için:**

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

Giriş sonrası `code=` değerini kopyala, ardından:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code&code=KOD&redirect_uri=https://localhost:9090&client_id=CLIENT_ID&client_secret=CLIENT_SECRET"
```

---

## Claude Code / Claude Desktop'a Ekleme

`claude_desktop_config.json` veya Claude Code MCP ayarlarına ekle:

```json
{
  "mcpServers": {
    "amazon-ads": {
      "command": "python3",
      "args": ["/tam/yol/amazon-claude-mcp/ads_server.py"]
    }
  }
}
```

---

## Araçlar

### Veri Araçları
| Araç | Açıklama |
|------|---------|
| `list_campaigns` | Tüm kampanyaları listele |
| `list_ad_groups` | Ad group'ları listele |
| `list_keywords` | Keyword'leri bid ve match type ile listele |
| `list_product_ads` | Reklam verilen ürünleri listele |
| `get_campaigns_report` | Kampanya performans raporu (son 30 gün) |
| `get_keywords_report` | Keyword performans raporu |
| `get_search_terms_report` | Arama terimi raporu |
| `get_products_report` | Ürün/ASIN performans raporu |

### Optimizasyon Araçları
| Araç | Açıklama |
|------|---------|
| `analyze_bid_performance` | Yüksek ACoS / düşük ROAS keyword'leri tespit et |
| `analyze_keyword_health` | Düşük performanslı keyword'leri tespit et |
| `analyze_budget_efficiency` | Budget cap ve ROAS sorunlu kampanyaları tespit et |
| `analyze_search_terms` | Keyword'e yükseltilecek / negatif eklenecek terimleri bul |
| `run_full_optimization` | Tüm analizleri çalıştır, tam rapor üret |

### Güncelleme Araçları
| Araç | Açıklama |
|------|---------|
| `update_campaign_budget` | Kampanya günlük bütçesini güncelle |
| `update_keyword_bid` | Keyword bid'ini güncelle |

---

## Kullanım

Claude Code veya Claude Desktop'ta doğrudan konuşarak kullan:

> "Amazon kampanyalarımı tam olarak analiz et ve optimizasyon raporu hazırla"

> "Keyword bid'lerimi analiz et, ACoS hedefim %25"

> "Hangi arama terimleri keyword olarak eklenmeli?"
