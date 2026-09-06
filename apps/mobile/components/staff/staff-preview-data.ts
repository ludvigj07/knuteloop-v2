export type StaffDecision = {
  action: 'keep' | 'remove' | 'suspend'
  reason: string
  duration?: 'day' | 'week'
}

export type StaffReport = {
  id: string
  title: string
  school: string
  knute: string
  russenavn: string
  receivedAt: string
  escalation: string
  description: string
  urgent: boolean
  visibility: 'hidden' | 'visible'
  decision?: StaffDecision
}

export type StaffEvent = {
  id: string
  reportId: string
  createdAt: string
  description: string
}

export function actionLabel(decision: StaffDecision): string {
  if (decision.action === 'keep') return 'Innsending beholdt'
  if (decision.action === 'remove') return 'Innsending fjernet'
  const duration = decision.duration === 'day' ? ' i ett døgn' : decision.duration === 'week' ? ' i én uke' : ''
  return `Innsending fjernet og bruker utestengt${duration}`
}

// Entirely fictional cases. A fresh set keeps separate preview sessions isolated.
export function createStaffReports(): StaffReport[] {
  return [
    {
      id: 'S-1041',
      title: 'En aktivitet trenger en ekstra vurdering',
      school: 'Eksempelskolen nord',
      knute: 'Ta en kveldspiknik',
      russenavn: 'Eksempelruss 1',
      receivedAt: '2026-09-06T08:40:00.000Z',
      escalation: 'Mulig fare – sendt direkte til Knuteloop',
      description: 'Fiktiv øvingssak om en aktivitet som kan være utrygg. Ingen bilder eller ekte opplysninger er knyttet til saken.',
      urgent: true,
      visibility: 'visible',
    },
    {
      id: 'S-1042',
      title: 'Uønsket omtale i bildeteksten',
      school: 'Eksempelskolen sør',
      knute: 'Lag en felles spilleliste',
      russenavn: 'Eksempelruss 2',
      receivedAt: '2026-09-06T08:15:00.000Z',
      escalation: 'Knutesjefen har bedt om hjelp',
      description: 'Fiktiv øvingssak om en bildetekst som omtaler en medelev. Innholdet er skjult manuelt i eksempelet mens saken vurderes.',
      urgent: false,
      visibility: 'hidden',
    },
    {
      id: 'S-1043',
      title: 'Samme bekymring er meldt på nytt',
      school: 'Eksempelskolen vest',
      knute: 'Inviter noen med på tur',
      russenavn: 'Eksempelruss 3',
      receivedAt: '2026-09-05T17:30:00.000Z',
      escalation: 'Gjentatt bekymring – trenger oppfølging',
      description: 'Fiktiv øvingssak for å prøve en midlertidig utestenging. Innholdet er allerede skjult manuelt i eksempelet. Ingen ekte bruker blir berørt.',
      urgent: true,
      visibility: 'hidden',
    },
    {
      id: 'S-1044',
      title: 'En rapport venter på avklaring',
      school: 'Eksempelskolen øst',
      knute: 'Del ditt beste studietips',
      russenavn: 'Eksempelruss 4',
      receivedAt: '2026-09-05T14:00:00.000Z',
      escalation: 'Ingen knutesjef tilgjengelig',
      description: 'Fiktiv øvingssak der innholdet kan beholdes etter vurdering. Rapporten alene har ikke skjult innsendingen.',
      urgent: false,
      visibility: 'visible',
    },
  ]
}
