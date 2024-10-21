// @ts ignore
import { io } from './socket';

export const SocketResponse = (data) => {
  return {
    message: data?.message,
    data: data,
  };
};
export const emitMessage = (key, data) => {
  io.emit(key, data);
};
