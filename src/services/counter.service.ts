import { db } from '../loaders/database.loader';

export const getNextSequence = async (sequenceName: string) => {
  const sequence = await db.counter.findOne({ where: { sequenceName } });
  if (sequence) {
    sequence.value = sequence.value + 1;
    await sequence.save();
    return sequence.value;
  }
  await db.counter.create({ sequenceName, value: 1 });
  return 1;
};

export const CounterService = {
  getNextSequence,
};
