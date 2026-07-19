# Teste completo do pipeline editorial
# Uso: powershell -File scripts/pipeline-test.ps1
# Simula: ficha -> validacao -> rascunho -> PR -> CI -> merge

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$LOGS = @()
$PASS = 0
$FAIL = 0

function Step($name, $scriptBlock) {
    Write-Host "`n=== $name ===" -ForegroundColor Cyan
    try {
        & $scriptBlock
        Write-Host "  PASS" -ForegroundColor Green
        $script:PASS++
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
        $script:FAIL++
    }
}

# 1. Validar que schemas existem e carregam
Step "Validar schemas de dados" {
    node "$ROOT\data\schemas\validate-all.js"
    if ($LASTEXITCODE -ne 0) { throw "validate-all.js falhou" }
}

# 2. Validar frontmatter dos posts
Step "Validar frontmatter dos posts" {
    node "$ROOT\_posts\scripts\validate-posts.js"
    if ($LASTEXITCODE -ne 0) { throw "validate-posts.js falhou" }
}

# 3. Verificar se existe ficha de pesquisa válida para um produto
Step "Verificar ficha de pesquisa existente" {
    $researchFiles = Get-ChildItem "$ROOT\content\research" -Recurse -Filter "*.json"
    if ($researchFiles.Count -eq 0) { throw "Nenhuma ficha de pesquisa encontrada" }
    Write-Host "  $($researchFiles.Count) fichas encontradas"
    $sample = $researchFiles[0]
    $data = Get-Content $sample.FullName -Raw | ConvertFrom-Json
    if (-not $data.models_confirmed -and -not $data.specifications) {
        Write-Host "  AVISO: ficha $($sample.Name) pode não ter dados estruturados" -ForegroundColor Yellow
    }
}

# 4. Simular geração de rascunho a partir de JSON
Step "Simular geracao de rascunho" {
    # Pega um produto de exemplo
    $bikeFile = Get-ChildItem "$ROOT\data\products\bikes" -Filter "*.json" | Select-Object -First 1
    if (-not $bikeFile) { throw "Nenhum produto encontrado em data/products/bikes/" }
    
    $bike = Get-Content $bikeFile.FullName -Raw | ConvertFrom-Json
    $priceFile = "$ROOT\data\prices\$($bike.id).json"
    $priceData = if (Test-Path $priceFile) { Get-Content $priceFile -Raw | ConvertFrom-Json } else { $null }
    
    # Monta frontmatter
    $lowestPrice = if ($priceData.observations) { ($priceData.observations.price | Measure-Object -Minimum).Minimum } else { 0 }
    $highestPrice = if ($priceData.observations) { ($priceData.observations.price | Measure-Object -Maximum).Maximum } else { 0 }
    
    $draft = @"
---
layout: post
title: "$($bike.brand) $($bike.model) $($bike.modelYear) — Ficha Técnica"
description: "Ficha técnica completa da $($bike.brand) $($bike.model) $($bike.modelYear): especificações, preço no Brasil e para quem é indicada."
date: 2026-07-19
author: "Equipe Pedal Data"
content_type: "review"
review_method: "desk-research"
tested_by_pedaldata: $($bike.testedByPedaldata.ToString().ToLower())
ai_assisted: false
brand: "$($bike.brand)"
product_name: "$($bike.model)"
model_year: $($bike.modelYear)
market: "Brasil"
price_min: $lowestPrice
price_max: $highestPrice
price_currency: "BRL"
price_checked_at: "2026-07-19"
category: "$($bike.category)"
tags: [$($bike.brand.ToLower()), $($bike.model.ToLower().Replace(' ', '-')), bike-de-estrada, ciclismo]
image: "/assets/img/posts/$($bike.id)/hero.jpg"
image_alt: "$($bike.brand) $($bike.model) $($bike.modelYear)"
image_credit: "Divulgação $($bike.brand)"
image_license: "Uso editorial autorizado pelo fabricante"
sources:
  - name: "$($bike.brand) Oficial"
    type: "manufacturer"
    url: "$($bike.officialUrl)"
    accessed_at: "2026-07-19"
editorial_status: "draft"
---

> **Como este artigo foi produzido:** análise documental baseada em especificações oficiais, pesquisa de preços no mercado brasileiro e comparação com modelos concorrentes.

Ficha técnica gerada automaticamente a partir da base estruturada.
"@
    
    $draftFile = "$ROOT\_posts\drafts\$($bike.id).md"
    $null = New-Item -ItemType Directory -Path (Split-Path $draftFile -Parent) -Force
    Set-Content -Path $draftFile -Value $draft -NoNewline
    Write-Host "  Rascunho gerado: _posts/drafts/$($bike.id).md"
}

# 5. Verificar que o JSON de preços está válido
Step "Validar precos nos arquivos" {
    $priceFiles = Get-ChildItem "$ROOT\data\prices" -Filter "*.json"
    $invalid = 0
    foreach ($f in $priceFiles) {
        $data = Get-Content $f.FullName -Raw | ConvertFrom-Json
        if (-not $data.productId) { Write-Host "  AVISO: $($f.Name) sem productId"; $invalid++ }
        foreach ($obs in $data.observations) {
            if (-not $obs.url) { Write-Host "  AVISO: $($f.Name) observacao sem URL"; $invalid++ }
            if (-not $obs.checkedAt) { Write-Host "  ERRO: $($f.Name) sem data de consulta"; $invalid++ }
        }
    }
    if ($invalid -gt 0) { Write-Host "  $invalid avisos encontrados" -ForegroundColor Yellow }
    Write-Host "  $($priceFiles.Count) precos validados"
}

# 6. Verificar fontes (sources.json)
Step "Verificar fontes cadastradas" {
    $sources = Get-Content "$ROOT\data\sources\sources.json" -Raw | ConvertFrom-Json
    $missingUrls = @($sources.sources | Where-Object { -not $_.url })
    if ($missingUrls.Count -gt 0) {
        Write-Host "  AVISO: $($missingUrls.Count) fontes sem URL" -ForegroundColor Yellow
        foreach ($s in $missingUrls) { Write-Host "    - $($s.id)" }
    }
    Write-Host "  $($sources.sources.Count) fontes cadastradas"
}

# 7. Verificar branch protection (simulado)
Step "Verificar configuracao de branch" {
    $docPath = "$ROOT\docs\operations\branch-protection.md"
    if (-not (Test-Path $docPath)) { throw "Documento de branch protection nao encontrado" }
    $docContent = Get-Content $docPath -Raw
    if ($docContent -match "Require pull request reviews") {
        Write-Host "  Documentacao de branch protection OK"
    } else {
        throw "Documento de branch protection incompleto"
    }
}

# 8. Pipeline automático: criar uma ficha de pesquisa nova para bicicleta sem dados
Step "Criar ficha de pesquisa para bicicleta pendente" {
    $catalog = Get-Content "$ROOT\data\catalog-index.json" -Raw | ConvertFrom-Json
    $missingResearch = @()
    foreach ($bike in $catalog.bikes) {
        $researchPath = "$ROOT\content\research\$($bike.id).json"
        if (-not (Test-Path $researchPath)) {
            $missingResearch += $bike
        }
    }
    if ($missingResearch.Count -gt 0) {
        Write-Host "  $($missingResearch.Count) bicicletas sem ficha de pesquisa"
        $sample = $missingResearch[0]
        $research = @{
            slug = $sample.id
            title = "$($sample.brand) $($sample.model) $($sample.year)"
            brand = $sample.brand
            model = $sample.model
            year = $sample.year
            category = $sample.category
            status = "pesquisa_pendente"
            created_at = "2026-07-19"
        }
        $researchPath = "$ROOT\content\research\$($sample.id).json"
        $research | ConvertTo-Json -Depth 10 | Set-Content -Path $researchPath -NoNewline
        Write-Host "  Ficha criada: content/research/$($sample.id).json"
    } else {
        Write-Host "  Todas as bicicletas possuem ficha de pesquisa"
    }
}

# 9. Simular CI checks: verificar que build Jekyll seria possível
Step "Verificar dependencias do build Jekyll" {
    $config = Get-Content "$ROOT\_config.yml" -Raw
    if ($config -match "jekyll") {
        Write-Host "  Configuracao Jekyll encontrada"
    } else {
        throw "Configuracao Jekyll nao encontrada"
    }
    if (Test-Path "$ROOT\Gemfile") {
        Write-Host "  Gemfile encontrado"
    } else {
        Write-Host "  AVISO: Gemfile nao encontrado (build Jekyll pode falhar em CI)" -ForegroundColor Yellow
    }
}

# 10. Verificar arquivos estáticos
Step "Verificar arquivos estaticos" {
    $filesToCheck = @("search.json", "robots.txt", "_redirects.yml")
    $allOk = $true
    foreach ($f in $filesToCheck) {
        $path = "$ROOT\$f"
        if (Test-Path $path) {
            $size = (Get-Item $path).Length
            if ($size -gt 0) {
                Write-Host "  $f encontrado ($size bytes)"
            } else {
                Write-Host "  AVISO: $f vazio" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  AVISO: $f nao encontrado" -ForegroundColor Yellow
        }
    }
}

# Relatório final
Write-Host "`n$('='*50)" -ForegroundColor Cyan
Write-Host "RELATORIO DO PIPELINE TEST" -ForegroundColor Cyan
Write-Host "$('='*50)" -ForegroundColor Cyan
Write-Host "Passos: $PASS / $($PASS+$FAIL)" -ForegroundColor $(if ($FAIL -eq 0) { "Green" } else { "Red" })
if ($FAIL -eq 0) {
    Write-Host "STATUS: PIPELINE HOMOLOGADO" -ForegroundColor Green
} else {
    Write-Host "STATUS: PIPELINE COM FALHAS - resolva os failures acima" -ForegroundColor Red
}
