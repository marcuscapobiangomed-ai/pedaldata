# Plano de Melhoria da Qualidade dos Dados

## Situação atual (Jul 2026)
- Score geral: 78% (target >85%)
- Produtos com geometria: 0/30 (0%)
- Preços atualizados <15 dias: 7/30 (23%)
- Produtos verificados score >=90: 0/30 (0%)

---

## 1. Geometrias (prioridade máxima)

### Fonte dos dados
- Sites oficiais dos fabricantes (tabelas de geometria)
- Bikester Global (dados agregados)
- Geometry Geeks (referência cruzada)

### Template JSON
```json
{
  "product_id": "tarmac-sl8-comp-2026",
  "brand": "Specialized",
  "model": "Tarmac SL8 Comp",
  "year": 2026,
  "sizes": [
    {
      "size": "52",
      "stack": 527,
      "reach": 385,
      "top_tube": 535,
      "seat_tube": 475,
      "head_tube": 120,
      "head_angle": 73,
      "seat_angle": 74,
      "chainstay": 410,
      "wheelbase": 988,
      "bb_drop": 72
    }
  ],
  "source": "https://www.specialized.com/...",
  "source_date": "2026-07-19"
}
```

### Prioridade (por busca esperada)
1. Specialized Tarmac SL8 (3 sizes mínimo)
2. Trek Madone Gen 8 / Émonda (6 sizes)
3. Scott Addict / Addict RC (5 sizes)
4. Cervélo Caledonia / Soloist / R5 / S5 (5 sizes)
5. Cannondale SuperSix Evo (8 sizes)
6. Decathlon Triban RC120/RC500 (4 sizes)
7. Trek Domane AL 2 (4 sizes)
8. Marcas nacionais (Soul 1R1, Oggi Velloce, Caloi Strada)

### Meta
- Semana 1: 10 produtos com geometria
- Semana 2: +10 produtos
- Semana 3: +10 produtos (total 30)

---

## 2. Atualização de Preços

### Ciclo
| Loja | Frequência | Método |
|---|---|---|
| Decathlon | Semanal | Site oficial |
| Mercado Livre | Semanal | Site |
| AllSports Store | Quinzenal | Site |
| Bert Bike Store | Quinzenal | Site |
| Soul Cycles | Quinzenal | Site |
| Specialized Brasil | Quinzenal | Site |
| Cervélo Brasil | Mensal | Site |
| Demarchi | Mensal | Site |
| Bike Center Ribeirão | Mensal | Site |
| Jauri Bike | Mensal | Site |

### Check automático
Preços com variação <30% são publicados automaticamente.
Variação >=30% gera alerta para revisão manual.

### Meta
- 80% dos produtos com preço atualizado a cada 15 dias
- Preços críticos (produtos mais buscados) atualizados semanalmente

---

## 3. Verificação de Produtos (score >=90)

### Critérios de score
| Critério | Peso |
|---|---|
| Nome/modelo correto | 20 |
| Fonte oficial confirmada | 20 |
| Preço com data e loja | 20 |
| Especificações completas | 20 |
| Geometria presente | 20 |
| **Total** | **100** |

### Produtos prioritários para verificação completa
1. Specialized Tarmac SL8 Comp/Pro/S-Works
2. Trek Madone SL 6/SL 7/SLR 7/SLR 9
3. Trek Émonda SL 6/SL 7/SLR 7/SLR 9
4. Scott Addict 20/30/40/50
5. Scott Addict RC 10/20/30
6. Scott Foil RC 10/20/Pro/Ultimate
7. Cervélo Caledonia/Soloist/R5/S5
8. Cannondale SuperSix Evo (todas)
9. Decathlon Triban RC120/RC500
10. Van Rysel EDR AF

---

## 4. Métricas de Acompanhamento

### Dashboard semanal
- [ ] Score geral de qualidade
- [ ] % produtos com preço atualizado
- [ ] % produtos com geometria
- [ ] Número de produtos verificados (score >=90)
- [ ] Erros de validação encontrados
- [ ] Correções pendentes

### Gatilhos
- Score <75%: pausar novos produtos, focar em correção
- Score >90%: iniciar expansão para nova categoria
- Preços <50% atualizados: revisar processo de coleta
