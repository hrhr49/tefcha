import {
  RangeList,
  createRangeList,
  RangeAllocator,
} from '../src/range-allocator'

test('create list of no ranges', () => {
  const emptyList: RangeList = {
    start: -Infinity,
    end: -Infinity,
    next: {
      start: Infinity,
      end: Infinity,
      next: null,
    }
  };
  expect(createRangeList()).toEqual(emptyList);
});

test('create list of two ranges', () => {
  const twoRangeList: RangeList = {
    start: -Infinity,
    end: -Infinity,
    next: {
      start: 0,
      end: 1,
      next: {
        start: 2,
        end: 3,
        next: {
          start: Infinity,
          end: Infinity,
          next: null,
        }
      }
    }
  };
  expect(createRangeList([0, 1], [2, 3])).toEqual(twoRangeList);
});

test('test findSpace', () => {
  const rangeList = createRangeList();
  const allocator = new RangeAllocator(rangeList);
  expect(allocator.findSpace(0, 1)).toBe(0);
});


test('test merge', () => {
  const rangeList = createRangeList();
  const allocator = new RangeAllocator(rangeList);

  allocator.merge(2, 3);
  expect(rangeList).toEqual(createRangeList([2, 5]));

  allocator.merge(3, 3);
  expect(rangeList).toEqual(createRangeList([2, 6]));

  // allocator can merge only >=ref.start range.
  allocator.merge(1, 3);
  expect(rangeList).toEqual(createRangeList([1, 6]));

  allocator.merge(6, 1);
  expect(rangeList).toEqual(createRangeList([1, 7]));

  const branch = allocator.clone();
  allocator.merge(9, 1);
  expect(rangeList).toEqual(createRangeList([1, 7], [9, 10]));

  const branch2 = branch.clone();
  branch.merge(8, 1);
  expect(rangeList).toEqual(createRangeList([1, 7], [8, 10]));

  branch2.merge(7, 1);
  expect(rangeList).toEqual(createRangeList([1, 10]));

  const rangeList2 = createRangeList([0, 1], [2, 3], [4, 5]);
  const allocator2 = new RangeAllocator(rangeList2);

  allocator2.merge(1, 3);
  expect(rangeList2).toEqual(createRangeList([0, 5]));
});

test('test ranges', () => {
  {
    const rangeList = createRangeList([0, 1], [2, 3]);
    const allocator = new RangeAllocator(rangeList);
    expect(allocator.ranges()).toEqual([{start: 0, end: 1}, {start: 2, end: 3}]);
  }

  {
    const rangeList = createRangeList();
    const allocator = new RangeAllocator(rangeList);
    expect(allocator.ranges()).toEqual([]);
  }

  {
    const rangeList = createRangeList([0, 1]);
    const allocator = new RangeAllocator(rangeList);
    expect(allocator.ranges()).toEqual([{start: 0, end: 1}]);
  }
});

test('test mergeAllocator', () => {
  {
    const rangeList1 = createRangeList([0, 1], [2, 3]);
    const rangeList2 = createRangeList([1, 2]);

    const allocator1 = new RangeAllocator(rangeList1);
    const allocator2 = new RangeAllocator(rangeList2);

    allocator1.mergeAllocator(allocator2);
    expect(rangeList1).toEqual(createRangeList([0, 3]));
  }

  {
    const rangeList1 = createRangeList();
    const rangeList2 = createRangeList([1, 2]);

    const allocator1 = new RangeAllocator(rangeList1);
    const allocator2 = new RangeAllocator(rangeList2);

    allocator1.mergeAllocator(allocator2);
    expect(rangeList1).toEqual(createRangeList([1, 2]));
  }

  {
    const rangeList1 = createRangeList([0, 1], [2, 3]);
    const rangeList2 = createRangeList();

    const allocator1 = new RangeAllocator(rangeList1);
    const allocator2 = new RangeAllocator(rangeList2);

    allocator1.mergeAllocator(allocator2);
    expect(rangeList1).toEqual(createRangeList([0, 1], [2, 3]));
  }
});
