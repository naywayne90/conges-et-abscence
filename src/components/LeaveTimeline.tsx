import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'submission' | 'validation' | 'rejection' | 'update';
  user: {
    name: string;
    role: string;
  };
  comment?: string;
}

interface LeaveTimelineProps {
  events: TimelineEvent[];
}

export const LeaveTimeline: React.FC<LeaveTimelineProps> = ({ events }) => {
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission':
        return 'bg-blue-500';
      case 'validation':
        return 'bg-green-500';
      case 'rejection':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'submission':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'validation':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejection':
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getEventColor(
                      event.type
                    )} ring-8 ring-white`}
                  >
                    {getEventIcon(event.type)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{event.user.name}</span>{' '}
                      {event.type === 'submission'
                        ? 'a soumis une demande'
                        : event.type === 'validation'
                        ? 'a validé la demande'
                        : event.type === 'rejection'
                        ? 'a rejeté la demande'
                        : 'a mis à jour la demande'}
                    </p>
                    {event.comment && (
                      <p className="mt-2 text-sm text-gray-600">{event.comment}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.date}>
                      {format(new Date(event.date), 'dd MMM yyyy à HH:mm', {
                        locale: fr,
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
