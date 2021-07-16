const AUTO_SCALE_TYPE_LIST = ['None', '100%', 'Width', 'Height', 'Auto'] as const;
type AutoScaleType = (typeof AUTO_SCALE_TYPE_LIST)[number];
{/* 'None' | '100%' | 'Width' | 'Height' | 'Auto' */}

const isAutoScaleType = (obj: any): obj is AutoScaleType => {
  return AUTO_SCALE_TYPE_LIST.includes(obj);
};

export {
  AutoScaleType,
  isAutoScaleType,
}
