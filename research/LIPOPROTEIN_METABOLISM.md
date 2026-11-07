# Lipid metabolizması: kaynak ve uygulama notu

8 Kasım 2026. Farmakoloji → Lipit düşürücüler → Lipid yolculuğu.

Girdi: `The Most in Depth Lipid Trafficking And Metabolism Explanation.md`. Dosya, [Dr. Alo’nun 2 Ağustos 2026 tarihli yazısına](https://www.dralo.net/blog/lipid-metabolism) bağlantı ve bir ekran görüntüsü içeriyor. SHA-256: `b7d4858535f61d67ade40f013aa31cee4884d97c8624a9f9e79b535895923dc0`. Görseller kopyalanmadı; sahneler özgün SVG olarak çizildi.

| Sahne | Doğrulama ve uygulama kararı |
| --- | --- |
| Karışık misel | [Westergaard ve Dietschy](https://www.jci.org/articles/view/108465): misel, sulu tabakadan lipid taşınmasına yardım eder. Şemada misel lümende kalır; bütün miselin enterosite girdiği izlenimi verilmez. |
| Sterol alımı ve geri atılımı | [Altmann ve ark.](https://pubmed.ncbi.nlm.nih.gov/14976318/), [Yu ve ark.](https://www.jci.org/articles/view/16001) ve [Zetia, §12.1](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=cb18564f-663f-4da2-9dd9-700ea9bdd398): NPC1L1 girişi ile ABCG5/G8 çıkışı ayrı gösterilir. Ezetimib karşılaştırmasında yalnız kolesterol geçişi görsel olarak azalır. |
| Şilomikron kurulumu ve lenf | [Xie ve ark.](https://pubmed.ncbi.nlm.nih.gov/16354657/) ve [Endotext](https://www.ncbi.nlm.nih.gov/books/NBK305896/): enterositte MTP ile apoB-48’e lipid yüklenir. Şilomikron, portal dolaşıma doğrudan giriş yerine lenf ve torasik kanal üzerinden venöz kana ulaşır. |
| HDL’den dolaylı geri taşıma | [Tall ve ark.](https://www.jci.org/articles/view/112940) ve [Endotext](https://www.ncbi.nlm.nih.gov/books/NBK305896/): kolesterol esteri HDL’den apoB partikülüne geçer, TG ters yönde gider. İkinci sahnede LDLR bütün LDL’yi alır. Mevcut doğrudan SR-BI sahnesi ayrı kalır. |

Yazıdaki sabit oranlar, partikül başına molekül sayıları, dolaşım süreleri ve klinik çıkarımlar animasyon parametresi olarak kullanılmadı. Noktalar, süre ve büyüklükler öğretim amaçlıdır. Akış hesabı, tedavi dozu ve hasta verisi yoktur.

Doğrulama: Node 22.14.0 ile `npm run check`, `npm test`, `npm run build`, `npm run test:pharmacology-browser`. Son komut, mobil taşmayı, TR/EN durumunu, duraklatma ve azaltılmış hareketi, ezetimib karşılaştırmasını ve CETP yüklerinin zıt yönlü hareketini gerçek tarayıcıda sınar.

Genel `npm run verify:browser` akışı, Eko ekran görüntüsü adımında `.echo-canvas` seçicisi iki tuvalle eşleştiği için durdu. Seçici ve iki tuvalin sınıfları değişiklik öncesi Git sürümünde de mevcut.
