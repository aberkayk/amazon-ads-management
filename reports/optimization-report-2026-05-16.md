# Amazon Ads Optimizasyon Raporu

**Tarih:** 16 Mayıs 2026  
**Analiz dönemi:** 16 Nisan – 16 Mayıs 2026

---

## 1. Teklif Performansı

**Durum:** 10 keywordden 2'si sorunlu

| Keyword | Eşleme | Bid | CPC (gerçek) | Harcama | Gelir | ACoS | ROAS |
|---|---|---|---|---|---|---|---|
| `hand massager` | BROAD | **$1.10** | **$2.13** | $125.48 | $117.98 | %106.36 | 0.94 |
| `hand massager with heat compression` | BROAD | $0.80 | $2.17 | $8.67 | $0 | — | 0 |

**Kritik bulgu — Dinamik Teklif Artırımı:**  
`hand massager` BROAD için belirlenen bid $1.10 iken Amazon gerçekte $2.13 CPC uyguluyor (%93 artış). Kampanyada **"Dynamic bids - up and down"** veya **"Dynamic bids - up only"** seçeneği aktif olabilir. Bu ayar kapatılmalı ya da **"Fixed bids"** moduna geçilmeli.

**Öneriler:**
- `hand massager` BROAD kampanya teklif stratejisini **Fixed bids** yapın — bid $1.10 kalabilir ama Amazon'un şişirmesinin önüne geçilir.
- `hand massager with heat compression` BROAD: 4 tıklama, $8.67 harcama, 0 satış — bid $0.80'den $0.50'ye düşürün veya durdurun.

---

## 2. Keyword Sağlığı

**Durum:** 10 keywordden 9'u sorunlu

| Keyword | Eşleme | Bid | Gösterim | Tıklama | Harcama | Satış | Sorun |
|---|---|---|---|---|---|---|---|
| `masajeador de manos artritis` | EXACT | $0.60 | 0 | 0 | $0 | $0 | Gösterim yok |
| `masajeador de manos artritis` | BROAD | $0.60 | 19 | 0 | $0 | $0 | Tıklama yok |
| `hand massager for arthritis and carpal tunnel` | EXACT | $0.60 | 0 | 0 | $0 | $0 | Gösterim yok |
| `hand massager for arthritis and carpal tunnel` | BROAD | $0.60 | 89 | 0 | $0 | $0 | Tıklama yok |
| `hand massager` | EXACT | $0.80 | 10 | 0 | $0 | $0 | Tıklama yok |
| `hand massager with heat compression` | EXACT | $0.60 | 0 | 0 | $0 | $0 | Gösterim yok |
| `hand massager with heat compression` | BROAD | $0.80 | 4.411 | 4 | $8.67 | $0 | Satış yok |
| `hand massager arthriti carpal tunnel` | EXACT | $1.00 | 5 | 0 | $0 | $0 | Yazım hatası |
| `hand massager arthriti carpal tunnel` | BROAD | $1.00 | 87 | 0 | $0 | $0 | Yazım hatası |

**Bulgular:**
- $0.60 bid'li EXACT keywordler gösterim alamıyor — bu kategori için minimum kazanma bid'i muhtemelen $1.00+ civarında.
- `hand massager for arthritis and carpal tunnel` BROAD 89 gösterim alıyor ama hiç tıklama yok — listing görseli veya başlık bu kitleye hitap etmiyor olabilir.
- `hand massager arthriti carpal tunnel` yazımı hatalı (`arthritis` olmalı). $1.00 bid'e rağmen bu yüzden performans düşük.

**Öneriler:**
- EXACT match keywordlerin bid'lerini $0.60 → $1.00-$1.20'ye çıkarın.
- `hand massager arthriti carpal tunnel` keywordünü silin, `hand massager arthritis carpal tunnel` olarak yeniden ekleyin.
- İspanyolca keywordlerin (`masajeador de manos artritis`) hedef marketplace'ini doğrulayın.

---

## 3. Bütçe Verimliliği

**Durum:** 5 kampanyadan 4'ü sorunlu

| Kampanya | Günlük Bütçe | 30 Günlük Harcama | Gelir | ROAS | ACoS | Notlar |
|---|---|---|---|---|---|---|
| Manuel Keyword | $10 | $136.67 | $117.98 | 0.86 | %115.84 | Zarar ediyor, dinamik bid şişirmesi var |
| Manuel Product - Higher Price | $10 | $0 | $0 | — | — | Ölü kampanya |
| Manuel Product - Lower Rating | $10 | $0 | $0 | — | — | Ölü kampanya |
| PPC Hack | $400 | $0 | $0 | — | — | Kasıtlı strateji: yüksek bütçe + düşük bid |

**Bulgular:**
- `Manuel Keyword` kampanyasındaki gerçek sorun bid değil, dinamik teklif artırımı — $1.10 bid $2.13 CPC'ye dönüşüyor (bkz. Bölüm 1).
- `PPC Hack` kasıtlı bir strateji (yüksek bütçe sinyal + düşük bid), sorun değil.
- `Manuel Product - Higher Price` ve `Manuel Product - Lower Rating` 30 günde hiç harcama yapmadı — listing görünürlük sorunu olabilir.

**Öneriler:**
- `Manuel Keyword` kampanyasını **Fixed bids** moduna alın — bid'e dokunmaya gerek yok.
- `Manuel Product` kampanyalarının neden harcama yapmadığını kontrol edin (listing durumu, kategori uyumu).

---

## 4. Arama Terimi Analizi

Veri alınamadı — API hatası. Bir sonraki analizde tekrar denenecek.

---

## Öncelikli Aksiyon Planı

| Öncelik | Aksiyon | Neden |
|---|---|---|
| 🔴 Acil | `Manuel Keyword` kampanyasını **Fixed bids** moduna al | Dinamik bid $1.10'u $2.13'e şişiriyor, ACoS %106 |
| 🟡 Bu hafta | `hand massager with heat compression` BROAD bid'ini $0.80 → $0.50'ye düşür | 0 satış, harcama devam ediyor |
| 🟡 Bu hafta | $0.60 bid'li EXACT keywordleri $1.00-$1.20'ye çıkar | Gösterim almıyorlar |
| 🟢 Bu ay | `hand massager arthriti carpal tunnel` keywordlerini sil, düzeltilmiş versiyonla yeniden ekle | Yazım hatası performansı engelliyor |
| 🟢 Bu ay | İspanyolca keywordlerin hedef marketplace'ini doğrula | 30 günde 0 performans |
