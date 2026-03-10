# Design System (Shadcn Standards)

Este documento define os padrões visuais e técnicos do Talent Connect, baseados no Shadcn UI e customizados para a identidade **Orange Premium**.

## 🎨 Cores (HSL)

O sistema utiliza variáveis HSL para permitir transparência e consistência entre temas Light e Dark.

| Variável | Descrição |
| :--- | :--- |
| `primary` | Laranja Premium (#ff6b00 / 25 100% 50%) |
| `background` | Cor de fundo da aplicação |
| `foreground` | Cor principal do texto |
| `card` | Fundo de cartões e painéis |
| `muted` | Textos e fundos secundários, menos enfáticos |
| `accent` | Elementos de destaque suave (hover, etc) |
| `destructive` | Ações de erro ou destruição |

## 📐 Raio (Border Radius)

Padronizado via variável `--radius`.

- `lg`: `--radius` (0.75rem / 12px)
- `md`: `calc(--radius - 2px)` (10px)
- `sm`: `calc(--radius - 4px)` (8px)

## ✍️ Tipografia (Inter)

Seguimos a regra estrita de pesos do Design Signature:

- **Regular**: 400
- **Medium**: 500
- **SemiBold**: 600
- **Proibido**: 700 (Bold) ou superior.

### Escala de Cabeçalhos
- `heading-4xl`: 40px / 600
- `heading-3xl`: 32px / 600
- `heading-2xl`: 24px / 600
- `heading-xl`: 20px / 600
- `heading-lg`: 18px / 600
- `heading-md`: 14px / 600

## 🚀 Como Aplicar

Use as classes de utilidade do Tailwind que apontam para os novos tokens:

```tsx
<div className="bg-card text-card-foreground border rounded-lg p-6">
  <h1 className="heading-xl text-primary">Título Orange</h1>
  <p className="text-muted-foreground">Texto secundário</p>
</div>
```

---

> Provedor: Talent Connect Operações
