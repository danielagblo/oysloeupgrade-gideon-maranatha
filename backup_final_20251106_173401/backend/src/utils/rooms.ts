export const toRoomKey = (roomId: string): string => `room:${roomId}`;

export const fromRoomKey = (roomKey: string): string => roomKey.replace('room:', '');

export const toPairKey = (user1Id: string, user2Id: string): string => {
  const [a, b] = [user1Id, user2Id].sort();
  return `${a}#${b}`;
};

export const toUserRoomKey = (userId: string, type: string): string => `${type}:${userId}`;
