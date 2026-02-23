import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { painZoneEnum, type PainZone } from '@/schemas/pain-note.schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

const PAIN_ZONE_LABELS: Record<PainZone, string> = {
  shoulder: 'Épaule',
  elbow: 'Coude',
  wrist: 'Poignet',
  back: 'Dos',
  hip: 'Hanche',
  knee: 'Genou',
  ankle: 'Cheville',
}

const INTENSITY_LABELS: Record<string, string> = {
  low: 'Légère (1-3)',
  medium: 'Modérée (4-6)',
  high: 'Forte (7-10)',
}

// Schema de validation pour le formulaire
const painNoteFormSchema = z.object({
  zone: painZoneEnum,
  intensity: z.number().int().min(1).max(10),
  note: z.string().max(500, 'Maximum 500 caractères').optional(),
})

type PainNoteFormValues = z.infer<typeof painNoteFormSchema>

interface PainNoteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PainNoteFormValues) => void | Promise<void>
}

/**
 * Formulaire de saisie de note de douleur articulaire.
 * Respecte AC3: "noter douleur articulaire avec zone, intensité 1-10, note optionnelle".
 * Story 3.4 : Personnalisation spontanée et notes de douleur
 */
export function PainNoteForm({ open, onOpenChange, onSubmit }: PainNoteFormProps) {
  const form = useForm<PainNoteFormValues>({
    resolver: zodResolver(painNoteFormSchema),
    defaultValues: {
      zone: 'shoulder',
      intensity: 5,
      note: '',
    },
  })

  // Obtenir le label d'intensité selon la valeur
  const getIntensityLabel = (value: number): string => {
    if (value <= 3) return INTENSITY_LABELS.low
    if (value <= 6) return INTENSITY_LABELS.medium
    return INTENSITY_LABELS.high
  }

  // Obtenir la couleur d'intensité selon la valeur
  const getIntensityColor = (value: number): string => {
    if (value <= 3) return 'text-green-500'
    if (value <= 6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const handleSubmit = async (data: PainNoteFormValues) => {
    await onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Noter une douleur
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone du corps</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAIN_ZONE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="intensity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex justify-between items-center">
                    <span>Intensité de la douleur</span>
                    <span className={`text-sm font-semibold ${getIntensityColor(field.value)}`}>
                      {field.value}/10 - {getIntensityLabel(field.value)}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="mt-2"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Légère (1)</span>
                    <span>Forte (10)</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajoutez une note (optionnel)..."
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <FormMessage />
                    <span>{field.value?.length || 0}/500</span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
