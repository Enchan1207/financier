import { env } from 'cloudflare:test';
import { ulid } from 'ulid';

import { createIncomeRecord } from '../domain/entity';
import { useIncomeRecordRepositoryD1 } from './repositoryImpl';

describe('IncomeRecord Repository', () => {
  const repository = useIncomeRecordRepositoryD1(env.D1);

  const dummyIncomeRecord = createIncomeRecord({
    userId: 'test_user',
    financialMonthId: ulid(),
    definitionId: ulid(),
    value: 1000,
    updatedBy: 'user',
  });

  beforeAll(async()=>{
    await repository.insertIncomeRecord(dummyIncomeRecord);
  })

  test('should insert and retrieve an IncomeRecord by ID', async () => {
    const actual = await repository.findIncomeRecordById(dummyIncomeRecord.id);

    expect(actual).toBeDefined();
    expect(actual).toEqual(dummyIncomeRecord);
  });
});
