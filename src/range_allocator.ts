// We have to manage y-axis allocation,
// because when layouting horizontal lines,
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


// NOTE:
//
// for any range list, first range must not removed
// by any of the function to the allocator point to it.
//
//


interface RangeList {
  start: number;
  end: number;
  next: RangeList | null;
}

const createRangeList = (...ranges: [number, number][]): RangeList => {
  // for convinience, these head and tail are used as general of linear search.
  const head = {
    start: -Infinity,
    end: -Infinity,
    next: null,
  };
  let cur = head;

  ranges.forEach(([start, end]) => {
    const range = {
      start, end,
      next: null,
    };
    cur.next = range;
    cur = range;
  });
  const tail = {
      start: Infinity,
      end: Infinity,
      next: null,
  };
  cur.next = tail;
  return head;
}


class RangeAllocator {
  // pointer to range list
  // this pointer can be moved forward when any method is called.
  private ref: RangeList;

  constructor (rangeList: RangeList) {
    this.ref = rangeList;
  }

  clone = (): RangeAllocator => {
    return new RangeAllocator(this.ref);
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
    let cur = this.ref;
    while (cur.next.start < start) cur = cur.next;
    let prevEnd = Math.max(start, cur.end);
    while (cur.next.start - prevEnd < size) {
      cur = cur.next;
      prevEnd = cur.end;
    }
    this.ref = cur;
    return prevEnd;
  };

  allocate = (
    start: number,
    size: number,
  ): number => {
    const rangeStart = this.findSpace(start, size);
    const rangeEnd = rangeStart + size;
    const cur = this.ref;
    if (cur.end === rangeStart) {
      if (cur.next.start === rangeEnd) {
        // +-----+-------+------+
        // | cur | range | next |
        // +-----+-------+------+
        cur.end = cur.next.end;
        cur.next = cur.next.next;
      } else {
        // +-----+-------+    +------+
        // | cur | range |    | next |
        // +-----+-------+    +------+
        cur.end = rangeEnd;
      }
    } else {
      if (cur.next.start === rangeEnd) {
        // +-----+   +-------+------+
        // | cur |   | range | next |
        // +-----+   +-------+------+
        cur.next.start = rangeStart;

        // ref should point the range contains allocated range
        this.ref = cur.next;
      } else {
        // +-----+   +-------+   +------+
        // | cur |   | range |   | next |
        // +-----+   +-------+   +------+
        const range = {
          start: rangeStart,
          end: rangeEnd,
          next: cur.next,
        }
        cur.next = range;

        // ref should point the range contains allocated range
        this.ref = range;
      }
    }
    return rangeStart;
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
    //  If start < ref.start, merge only >=ref.start range
    start = Math.max(start, this.ref.start);

    let cur = this.ref;
    let range: RangeList;
    while (cur.next.start <= start) cur = cur.next;
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

    while (cur.next.start <= end) cur = cur.next;
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
    this.ref = range;
  }

  ranges = (): {start: number, end: number}[] => {
    // NOTE: this method does not change ref.
    const ret = [];
    let cur = this.ref;
    if (cur.start === -Infinity)cur = cur.next;
    while (cur.start !== Infinity) {
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
