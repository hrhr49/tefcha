// We have to manage y-axis allocation,
// because when laying out horizontal lines,
// we want to avoid other nodes or horizontal lines.

// 
//                . 
//                .
//                .                                               
//                |                                               
//                |                                               
//          +-----+-----+                                         
//          |           |                                         
//          |           |                                         
//          |           |                                         
//          +-----+-----+                                         
//                |         horizontal line
//   <--------------------------------  OK
//                |                                               
//                |                                               
//          +-----+-----+                                         
//          |           |                                         
//   <--------------------------------  NG
//          |           |                                         
//          +-----+-----+                                         
//                |                                               
//                |                                               
//                .                                               
//                .
//                .

// TODO:
// improve algorithm. this algorithm is not smart...


interface RangeList {
  start: number;
  end: number;
  next: RangeList | RangeListTail;
}

interface RangeListTail {
  start: number;
  end: number;
  next: null;
}

const isRangeListTail = (obj: any): obj is RangeListTail => {
  return (
    typeof(obj?.start) === 'number'
    && typeof(obj?.end) === 'number'
    && obj?.next === null
  );
};

const createRangeList = (...ranges: [number, number][]): RangeList => {
  const tail: RangeListTail = {
      start: Infinity,
      end: Infinity,
      next: null,
  };

  let cur: RangeList | RangeListTail = tail;
  ranges.slice().reverse().forEach(([start, end]) => {
    const range = {
      start, end,
      next: cur,
    };
    cur = range;
  });

  const head: RangeList = {
    start: -Infinity,
    end: -Infinity,
    next: cur,
  };

  return head;
}


class RangeAllocator {
  // pointer to range list
  // this pointer can be moved forward when any method is called.
  private readonly head: RangeList;

  constructor (rangeList: RangeList) {
    this.head = rangeList;
  }

  clone = (): RangeAllocator => {
    return new RangeAllocator(this.head);
  };

  cloneDeep = (): RangeAllocator => {
    // clone range list too.
    return new RangeAllocator(createRangeList(
      ...this.ranges().map(({start, end}) => [start, end] as [number, number])
    ));
  };

  findSpace = (
    start: number,
    size: number,
  ): number => {
    //  Find enough space to put the range of size "size".
    //
    //          size
    //        <------>                      
    //        +------+              .       
    //        |      | NG           .       
    //        +------+       OK     .
    //        .    .      +------+  .              
    //        .    .      |      |  .         
    //        .    .      +------+  .         
    //        .    .      .         .
    //  +-----+    +------+         +---+   
    //  |     |    |      |         |   |   ... range list
    //  +-----+    +------+         +---+   
    // 
    let cur: RangeList = this.head;
    while (
      !isRangeListTail(cur.next) 
      && cur.next.start < start
    ) {
      cur = cur.next;
    }
    let prevEnd = Math.max(start, cur.end);
    while (
      !isRangeListTail(cur.next)
      && cur.next.start - prevEnd < size
    ) {
      cur = cur.next;
      prevEnd = cur.end;
    }
    return prevEnd;
  };

  merge = (start: number, size: number): void => {
    //  Allocate range between "start" and "end"
    //  and merge all ranges in this range
    //
    //    Before
    //
    //     start                  end
    //     v                      v 
    //     +------         -------+
    //     | merge ...            |
    //     +------         -------+
    //  +-----+   +---+     +---+ .  +---+ 
    //  |     |   |   | ... |   | .  |   | ... range list
    //  +-----+   +---+     +---+ .  +---+ 
    //  .                         .
    //  .                         .
    //  . After                   .
    //  .                         .
    //  +-------------------------+  +---+            
    //  |  merged                 |  |   | ... range list
    //  +-------------------------+  +---+            
    //

    const end = start + size;
    let cur = this.head;
    let range: RangeList;
    while (
      !isRangeListTail(cur.next)
      && cur.next.start <= start
    ) {
      cur = cur.next;
    }
    if (start <= cur.end) {
      //    start
      //    v
      //    +------            
      //    | merge ...
      //    +------            
      // +-----+     +------+
      // | cur |     | next |
      // +-----+     +------+
      //
      // Corner Case:
      //
      //  start
      //  v
      //  +------            
      //  | merge ...
      //  +------            
      //  +-----+     +------+
      //  | cur |     | next |
      //  +-----+     +------+
      range = cur;
    } else {
      //          start
      //          v
      //          +------            
      //          | merge ...
      //          +------            
      // +-----+     +------+
      // | cur |     | next |
      // +-----+     +------+
      range = {
        start,
        end: start,
        next: cur.next,
      };
      cur.next = range;
      cur = range;
    }

    while (
      !isRangeListTail(cur.next)
      && cur.next.start <= end
    ) {
      cur = cur.next;
    }
    if (end <= cur.end) {
      //           end
      //           v
      //    -------+                  
      // ... merge |              
      //    -------+                  
      //        +-----+     +------+
      //        | cur |     | next |
      //        +-----+     +------+
      //
      // Corner Case:
      //
      //           end
      //           v
      //    -------+                  
      // ... merge |              
      //    -------+                  
      //           +-----+     +------+
      //           | cur |     | next |
      //           +-----+     +------+
      range.end = cur.end;
      range.next = cur.next;
    } else {
      //            end
      //            v
      //     -------+                  
      //  ... merge |              
      //     -------+                  
      //   +-----+     +------+
      //   | cur |     | next |
      //   +-----+     +------+
      range.end = end;
      range.next = cur.next;
    }
  }

  ranges = (): {start: number, end: number}[] => {
    // NOTE: this method does not change ref.
    const ret = [];
    let cur: RangeList | RangeListTail = this.head;
    if (cur.start === -Infinity) {
      cur = cur.next;
    }
    while (!isRangeListTail(cur)) {
      ret.push({start: cur.start, end: cur.end});
      cur = cur.next;
    }
    return ret;
  }

  mergeAllocator = (allocator: RangeAllocator): void => {
    allocator.ranges().forEach(({start, end}) => {
      this.merge(start, end - start);
    });
  }
}

export {
  RangeList,
  createRangeList,
  RangeAllocator,
};
