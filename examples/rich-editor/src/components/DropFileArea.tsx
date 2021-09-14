import * as React from 'react'
import {useDropzone} from 'react-dropzone'

interface IDropFileArea {
  onDropFile(file: File): void;
  children: any;
}

const DropFileArea: React.FC<IDropFileArea> = ({onDropFile, children}) => {
  const onDrop = (acceptedFiles: File[]) => {
    onDropFile(acceptedFiles[0]);
  };
  const {getRootProps, getInputProps} = useDropzone({onDrop})

  return (
    <div {...getRootProps({
        onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => event.stopPropagation(),
      })}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <input {...getInputProps()} />
      { children }
    </div>
  )
}

export {
  DropFileArea
};
