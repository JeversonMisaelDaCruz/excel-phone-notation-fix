# Conversor de Telefones Excel

Converte números de telefone em notação científica para formato simples em planilhas Excel.

## Problema que Resolve

Quando planilhas Excel contêm números de telefone longos (10-11 dígitos), o Excel frequentemente os exibe em notação científica:

- **Antes**: `1.19988776655E+10`
- **Depois**: `11998877665`

Este script automatiza a conversão e validação de telefones brasileiros.

## Instalação

```bash
# 1. Clone ou baixe este projeto
cd resolve

# 2. Instale as dependências
npm install
```

## Como Usar

### Uso Básico

```bash
# Conversão simples (detecta colunas automaticamente)
node run.js --input="Seped_251127.xls"
```

Isso irá:
1. Ler o arquivo `Seped_251127.xls`
2. Detectar automaticamente colunas com telefones
3. Converter notação científica para números simples
4. Salvar em `Seped_251127_fixed.xls`
5. Gerar relatório em `Seped_251127_report.json`

### Opções Avançadas

```bash
# Especificar arquivo de saída
node run.js --input="dados.xlsx" --output="./convertidos/dados_fixed.xlsx"

# Sobrescrever arquivo original
node run.js --input="phones.xls" --mode=overwrite

# Especificar colunas manualmente (colunas 3 e 5, contando a partir de 1)
node run.js --input="dados.xls" --phone-columns="3,5"

# Apenas validar sem converter
node run.js --input="dados.xls" --validate-only

# Modo detalhado (verbose)
node run.js --input="dados.xls" --verbose
```

### Todas as Opções

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `--input, -i` | Arquivo Excel de entrada (obrigatório) | `--input="arquivo.xls"` |
| `--output, -o` | Arquivo ou diretório de saída | `--output="./saida"` |
| `--mode, -m` | Modo: `new` (padrão), `overwrite`, `directory` | `--mode=overwrite` |
| `--phone-columns, -c` | Colunas específicas (1-indexed, separadas por vírgula) | `--phone-columns="2,4"` |
| `--validate-only, -v` | Apenas validar, não converter | `--validate-only` |
| `--verbose` | Modo detalhado | `--verbose` |
| `--help, -h` | Ajuda | `--help` |

## Exemplos de Uso

### 1. Converter arquivo do cliente

```bash
node run.js --input="Seped_251127.xls"
```

**Saída:**
- `Seped_251127_fixed.xls` (arquivo convertido)
- `Seped_251127_report.json` (relatório detalhado)

### 2. Organizar em pasta de saída

```bash
mkdir convertidos
node run.js --input="dados.xlsx" --output="./convertidos" --mode=directory
```

### 3. Processar múltiplos arquivos

```bash
# Em bash/terminal
for file in *.xls; do
  node run.js --input="$file"
done
```

## Validação de Telefones Brasileiros

O script valida telefones segundo regras brasileiras:

- **Comprimento**: 10 dígitos (fixo) ou 11 dígitos (celular)
- **DDD válido**: 11-99
- **Celular**: terceiro dígito deve ser 9
- **Rejeita**: números com todos dígitos iguais (ex: 11111111)

### Exemplos de Telefones Válidos

- `11987654321` (celular SP)
- `1134567890` (fixo SP)
- `85912345678` (celular CE)

### Exemplos de Telefones Inválidos

- `01987654321` (DDD inválido: 01)
- `11887654321` (celular sem 9 na 3ª posição)
- `119876543` (muito curto)
- `11111111111` (dígitos repetidos)

## Relatório de Conversão

Após processar, o script gera um relatório JSON detalhado:

```json
{
  "timestamp": "2025-11-27T10:30:45.123Z",
  "inputFile": "Seped_251127.xls",
  "outputFile": "Seped_251127_fixed.xls",
  "summary": {
    "totalRows": 1000,
    "cellsProcessed": 1200,
    "cellsConverted": 1150,
    "cellsSkipped": 50,
    "cellsInvalid": 5
  },
  "conversionDetails": [
    {
      "row": 2,
      "column": "Telefone",
      "original": "1.19988776655E+10",
      "converted": "11998877665",
      "validation": "PASS"
    }
  ],
  "errors": [],
  "warnings": []
}
```

## Detecção Automática de Colunas

O script detecta automaticamente colunas de telefone baseado em:

1. **Nome da coluna**: contém "tel", "fone", "phone"
2. **Notação científica**: valores em formato E+10 ou E+11
3. **Padrão numérico**: valores com 10-11 dígitos

Você pode desativar a detecção automática especificando colunas manualmente:

```bash
node run.js --input="dados.xls" --phone-columns="3,5"
```

## Estrutura do Projeto

```
resolve/
├── src/
│   ├── converters/
│   │   ├── scientificNotationHandler.js  # Conversão de notação científica
│   │   └── phoneConverter.js             # Conversão de telefones
│   ├── validators/
│   │   ├── phoneValidator.js             # Validação BR
│   │   └── excelValidator.js             # Validação de arquivos
│   ├── readers/
│   │   └── excelReader.js                # Leitura Excel
│   ├── writers/
│   │   └── excelWriter.js                # Escrita Excel
│   ├── processors/
│   │   └── excelProcessor.js             # Orquestrador principal
│   ├── utils/
│   │   ├── logger.js                     # Sistema de logs
│   │   └── constants.js                  # Constantes
│   └── index.js                          # Entry point
├── run.js                                 # CLI
├── package.json
└── README.md
```

## Solução de Problemas

### Erro: "Arquivo não encontrado"

Verifique o caminho do arquivo. Use caminho absoluto ou relativo correto:

```bash
# Caminho relativo
node run.js --input="./Seped_251127.xls"

# Caminho absoluto
node run.js --input="/Users/seu-usuario/Downloads/Seped_251127.xls"
```

### Erro: "Nenhuma coluna detectada"

Especifique as colunas manualmente:

```bash
node run.js --input="arquivo.xls" --phone-columns="3" --verbose
```

### Telefones aparecem em notação científica no Excel

Após a conversão, abra o arquivo e:
1. Selecione as colunas de telefone
2. Clique com botão direito > "Formatar células"
3. Escolha "Texto" como formato
4. Confirme

Ou simplesmente use o arquivo convertido pelo script - ele já aplica formato de texto automaticamente.

## Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **xlsx**: Leitura de arquivos Excel (.xls e .xlsx)
- **exceljs**: Escrita de arquivos Excel com formatação
- **yargs**: Parsing de argumentos CLI
- **chalk**: Cores no terminal

## Licença

ISC

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório do projeto.
