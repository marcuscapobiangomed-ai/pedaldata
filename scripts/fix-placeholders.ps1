# Script de correcao de placeholders nos artigos
# Uso: powershell -File scripts/fix-placeholders.ps1

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$POSTS_DIR = "$ROOT\_posts"
$PRICES_DIR = "$ROOT\data\prices"
$PRODUCTS_DIR = "$ROOT\data\products\bikes"

$fixed = @{reviewed_by = 0; price_min = 0; price_max = 0; image_credit = 0; brand = 0}

# Carrega precos para referencia
$priceData = @{}
if (Test-Path $PRICES_DIR) {
    Get-ChildItem $PRICES_DIR -Filter "*.json" | ForEach-Object {
        $data = Get-Content $_.FullName -Raw | ConvertFrom-Json
        if ($data.observations) {
            $prices = $data.observations.price | Where-Object { $_ -gt 0 }
            if ($prices) {
                $priceData[$data.productId] = @{
                    min = ($prices | Measure-Object -Minimum).Minimum
                    max = ($prices | Measure-Object -Maximum).Maximum
                }
            }
        }
    }
}

# Carrega produtos para referenciar precos via catalog-index
$catalog = @{}
$catalogPath = "$ROOT\data\catalog-index.json"
if (Test-Path $catalogPath) {
    $catData = Get-Content $catalogPath -Raw | ConvertFrom-Json
    foreach ($b in $catData.bikes) {
        if ($b.priceLowest -and $b.priceLowest -gt 0) {
            $catalog[$b.id] = @{min = $b.priceLowest; max = $b.priceLowest}
        }
    }
}

# Processa todos os posts
Get-ChildItem $POSTS_DIR -Recurse -Filter "*.md" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    $original = $content
    $fileName = $_.Name

    # 1. reviewed_by: "" -> removido (campo opcional vazio)
    if ($content -match "reviewed_by: `"`"") {
        $content = $content -replace "reviewed_by: `"`"`r?`n", ""
        $fixed.reviewed_by++
    }

    # 2. image_credit: "" -> "Divulgacao"
    if ($content -match "image_credit: `"`"") {
        $content = $content -replace 'image_credit: ""', 'image_credit: "Divulgação"'
        $fixed.image_credit++
    }

    # 3. brand: "" -> remove a linha (artigo sem produto especifico)
    if ($content -match "brand: `"`"") {
        $content = $content -replace "brand: `"`"`r?`n", ""
        $fixed.brand++
    }

    # 4. price_min: 0 / price_max: 0  -> tenta extrair do post ou da base
    if ($content -match "price_min: 0" -or $content -match "price_max: 0") {
        # Tenta extrair product_id do frontmatter para buscar na base
        $match = [regex]::Match($content, "product_id:\s*(\S+)")
        $prodId = if ($match.Success) { $match.Groups[1].Value } else { $null }
        
        $minVal = $null
        $maxVal = $null
        
        if ($prodId -and $priceData[$prodId]) {
            $minVal = $priceData[$prodId].min
            $maxVal = $priceData[$prodId].max
        } elseif ($prodId -and $catalog[$prodId]) {
            $minVal = $catalog[$prodId].min
        }
        
        # Se tem valores, substitui
        if ($minVal) {
            $content = $content -replace "price_min: 0", "price_min: $minVal"
            $fixed.price_min++
        }
        if ($maxVal) {
            $content = $content -replace "price_max: 0", "price_max: $maxVal"
            $fixed.price_max++
        }
    }

    if ($content -ne $original) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  Corrigido: $fileName"
    }
}

Write-Host "`nPlaceholders corrigidos:"
Write-Host "  reviewed_by removidos: $($fixed.reviewed_by)"
Write-Host "  price_min preenchidos: $($fixed.price_min)"
Write-Host "  price_max preenchidos: $($fixed.price_max)"
Write-Host "  image_credit preenchidos: $($fixed.image_credit)"
Write-Host "  brand vazios removidos: $($fixed.brand)"
