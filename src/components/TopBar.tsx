import React from 'react'

type Props = {
  title: string
  left?: React.ReactNode
  right?: React.ReactNode
}

export default function TopBar({ title, left, right }: Props) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b-2 border-black pb-3">
      <div className="flex items-center">{left}</div>
      <h1 className="text-base font-bold tracking-wide px-2">{title}</h1>
      <div className="flex items-center justify-end">{right}</div>
    </div>
  )
}
