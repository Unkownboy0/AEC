import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export const campusEvents = [
  'student.created',
  'student.updated',
  'attendance.updated',
  'marks.updated',
  'leave.submitted',
  'leave.approved',
  'leave.rejected',
  'notification.created',
  'circular.created',
  'assignment.created',
  'assignment.updated',
  'fees.updated',
  'placement.created',
  'exam.created',
  'result.published',
  'role.updated',
  'permission.updated',
  'workspace.updated',
  'profile.updated',
  'file.uploaded',
] as const;

export function connectLiveSync(accessToken: string, onEvent: (event: string) => void) {
  const socket: Socket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket'],
    auth: { token: accessToken },
    reconnection: true,
  });

  campusEvents.forEach((event) => socket.on(event, () => onEvent(event)));
  return socket;
}