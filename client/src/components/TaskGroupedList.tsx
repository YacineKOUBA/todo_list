import type { TacheListe } from '../types'
import { TaskCard } from './TaskCard'

interface TaskGroupedListProps {
  taches: TacheListe[]
  totalSimples: number
  totalRecurrentes: number
  onOuvrir: (id: string) => void
  estAdmin?: boolean
}

export function TaskGroupedList({
  taches,
  totalSimples,
  totalRecurrentes,
  onOuvrir,
  estAdmin = false,
}: TaskGroupedListProps) {
  const simples = taches.filter((tache) => tache.typeTache === 'SIMPLE')
  const recurrentes = taches.filter((tache) => tache.typeTache === 'RECURRENTE')

  return (
    <>
      {totalSimples > 0 && (
        <section className="groupe-taches" aria-labelledby="titre-taches-simples">
          <h2 className="groupe-taches__titre" id="titre-taches-simples">
            Tâches simples ({totalSimples})
          </h2>
          {simples.length === 0 ? (
            <p className="groupe-taches__vide">Aucune tâche simple sur cette page.</p>
          ) : (
            <div className="liste">
              {simples.map((tache) => (
                <TaskCard key={tache.id} tache={tache} onOuvrir={onOuvrir} estAdmin={estAdmin} />
              ))}
            </div>
          )}
        </section>
      )}

      {totalRecurrentes > 0 && (
        <section className="groupe-taches" aria-labelledby="titre-taches-recurrentes">
          <h2 className="groupe-taches__titre" id="titre-taches-recurrentes">
            Tâches récurrentes ({totalRecurrentes})
          </h2>
          {recurrentes.length === 0 ? (
            <p className="groupe-taches__vide">Aucune tâche récurrente sur cette page.</p>
          ) : (
            <div className="liste">
              {recurrentes.map((tache) => (
                <TaskCard key={tache.id} tache={tache} onOuvrir={onOuvrir} estAdmin={estAdmin} />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  )
}
