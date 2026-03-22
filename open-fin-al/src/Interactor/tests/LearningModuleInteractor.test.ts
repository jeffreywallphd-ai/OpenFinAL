import { LearningModuleInteractor } from '../LearningModuleInteractor';

const mockRead = jest.fn();
jest.mock('../../Entity/LearningModule', () => ({ LearningModule: jest.fn().mockImplementation(() => ({ fillWithRequest: jest.fn() })) }));
jest.mock('../../Gateway/Data/SQLite/LearningModuleSQLiteDBGateway', () => ({ LearningModuleSQLiteDBGateway: jest.fn().mockImplementation(() => ({ read: mockRead })) }));

describe('LearningModuleInteractor', () => {
  beforeEach(() => mockRead.mockResolvedValue([]));

  it('get reads via sqlite gateway', async () => {
    const req: any = { request: { request: { learningModule: { action: 'read' } } } };
    await new LearningModuleInteractor().get(req);
    expect(mockRead).toHaveBeenCalledWith(expect.anything(), 'read');
  });

  it('post/put/delete throw not implemented', async () => {
    const interactor = new LearningModuleInteractor();
    expect(() => interactor.post({} as any)).toThrow('Method not implemented.');
    expect(() => interactor.put({} as any)).toThrow('Method not implemented.');
    expect(() => interactor.delete({} as any)).toThrow('Method not implemented.');
  });
});
