import React from 'react'

interface Props {
  size?: number
}

function HiringRemove({ size = 48 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#FFC4D1" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.9062 13C19.5785 13 18.5 14.0785 18.5 15.4062V33.625H26.1896C26.0656 33.1035 26 32.5594 26 32C26 29.409 27.4077 27.1468 29.5 25.9365V15.4062C29.5 14.0785 28.4215 13 27.0938 13H20.9062ZM20.5625 17.125V15.4062C20.5625 15.2172 20.7172 15.0625 20.9062 15.0625H27.0938C27.2828 15.0625 27.4375 15.2172 27.4375 15.4062V17.125H20.5625Z"
        fill="#D80027"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M29.5 28.4293C28.5743 29.3367 28 30.6013 28 32C28 32.5689 28.095 33.1155 28.27 33.625C28.9445 35.5887 30.8074 37 33 37C35.7614 37 38 34.7614 38 32C38 29.9497 36.7659 28.1876 35 27.416C34.3875 27.1484 33.7111 27 33 27C32.2402 27 31.5199 27.1695 30.875 27.4727C30.3633 27.7133 29.899 28.0381 29.5 28.4293ZM30.25 32C30.25 32.4142 30.5858 32.75 31 32.75H35C35.4142 32.75 35.75 32.4142 35.75 32C35.75 31.5858 35.4142 31.25 35 31.25H31C30.5858 31.25 30.25 31.5858 30.25 32Z"
        fill="#D80027"
      />
      <path
        d="M33 25C33.695 25 34.3663 25.1013 35 25.2899V19.875C35 18.3582 33.7668 17.125 32.25 17.125H30.875V25.3284C31.5452 25.1151 32.2592 25 33 25Z"
        fill="#D80027"
      />
      <path
        d="M17.125 17.125H15.75C14.2332 17.125 13 18.3582 13 19.875V30.875C13 32.3918 14.2332 33.625 15.75 33.625H17.125V17.125Z"
        fill="#D80027"
      />
    </svg>
  )
}

export default HiringRemove