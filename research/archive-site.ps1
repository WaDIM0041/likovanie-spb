$ErrorActionPreference = 'Stop'
$base = 'https://likovanie-spb.ru'
foreach ($name in @('robots.txt','sitemap.xml','privacy','soglasie')) {
 try { Invoke-WebRequest -Uri "$base/$name" -OutFile "research/source/$($name.Replace('.','-')).txt" } catch { $_.Exception.Message | Set-Content "research/source/$($name.Replace('.','-'))-error.txt" }
}
$html = Get-Content 'research/source/home.html' -Raw
$text = [regex]::Replace($html, '<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>', '', 'Singleline')
$text = [regex]::Replace($text, '<[^>]+>', "`n")
$text = [System.Net.WebUtility]::HtmlDecode($text)
$text = ($text -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join "`n"
$text | Set-Content 'research/source/home-text.txt' -Encoding utf8
$urls = Get-Content 'research/source/asset-urls.txt' | Where-Object { $_ -match '\.(jpg|jpeg|png|webp|svg|gif)(\?|$)' }
$manifest = @(); $i = 0
foreach ($url in $urls) {
 $i++; $ext = [IO.Path]::GetExtension(([uri]$url).AbsolutePath)
 $path = 'research/assets/{0:D3}{1}' -f $i,$ext
 try { Invoke-WebRequest -Uri $url -OutFile $path -TimeoutSec 20; $status = 'downloaded'; $bytes = (Get-Item $path).Length } catch { $status = $_.Exception.Message; $bytes = 0 }
 $manifest += [pscustomobject]@{url=$url;path=$path;status=$status;bytes=$bytes}
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content 'research/source/assets-manifest.json' -Encoding utf8
$manifest | Group-Object status | Select-Object Count,Name
