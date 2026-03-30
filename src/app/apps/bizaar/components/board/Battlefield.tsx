'use client'

import type { BoardState, RowType, EmpireStatus, SuppressionRecord, CardInstance } from '@/lib/bizaar/engine/types'
import { OPPONENT_ROW_ORDER, PLAYER_ROW_ORDER } from '@/lib/bizaar/engine/constants'
import BoardRow from './BoardRow'

interface BattlefieldProps {
  board: BoardState
  canPlayRow: (row: RowType) => boolean
  onRowClick: (row: RowType) => void
  empireStatuses: EmpireStatus[]
  suppressions: SuppressionRecord[]
  playerTotal: number
  opponentTotal: number
  onInspectCard?: (card: CardInstance) => void
}

export default function Battlefield({
  board,
  canPlayRow,
  onRowClick,
  empireStatuses,
  suppressions,
  playerTotal,
  opponentTotal,
  onInspectCard,
}: BattlefieldProps) {
  const playerLeading = playerTotal > opponentTotal
  const opponentLeading = opponentTotal > playerTotal

  return (
    <div className="bzr-battlefield">
      {/* Opponent rows (mirrored order) */}
      {OPPONENT_ROW_ORDER.map((rowType) => (
        <BoardRow
          key={`opp-${rowType}`}
          row={board.rows[rowType]}
          side="opponent"
          canPlay={false}
          onRowClick={() => {}}
          empireStatuses={empireStatuses}
          suppressions={suppressions}
          onInspectCard={onInspectCard}
        />
      ))}

      {/* Central divider with score comparison */}
      <div className="bzr-divider">
        <div className="bzr-divider-scores">
          <span className={`bzr-divider-opp ${opponentLeading ? 'bzr-divider-score--leading' : ''}`}>
            {opponentTotal}
          </span>
          <span className="bzr-divider-gem">&#x25C6;</span>
          <span className={`bzr-divider-plr ${playerLeading ? 'bzr-divider-score--leading' : ''}`}>
            {playerTotal}
          </span>
        </div>
      </div>

      {/* Player rows */}
      {PLAYER_ROW_ORDER.map((rowType) => (
        <BoardRow
          key={`plr-${rowType}`}
          row={board.rows[rowType]}
          side="player"
          canPlay={canPlayRow(rowType)}
          onRowClick={() => onRowClick(rowType)}
          empireStatuses={empireStatuses}
          suppressions={suppressions}
          onInspectCard={onInspectCard}
        />
      ))}
    </div>
  )
}
