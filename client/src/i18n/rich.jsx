import { Fragment } from 'react';

// Turns "Press [[Space]] to climb" into text with a <kbd> element for each [[key]].
export function rich(text) {
  return text.split(/(\[\[[^\]]+\]\])/g).map((part, i) =>
    part.startsWith('[[') ? <kbd key={i}>{part.slice(2, -2)}</kbd> : <Fragment key={i}>{part}</Fragment>
  );
}
