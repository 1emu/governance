export enum ContractVersion {
  V1 = 'v1',
  V2 = 'v2',
}

export type Topics = {
  RELEASE: string
  REVOKE: string
  TRANSFER_OWNERSHIP: string
  PAUSED: string
  UNPAUSED: string
}

export const TopicsByVersion: Record<ContractVersion, Topics> = {
  [ContractVersion.V1]: {
    RELEASE: '0xfb81f9b30d73d830c3544b34d827c08142579ee75710b490bab0b3995468c565',
    REVOKE: '0x44825a4b2df8acb19ce4e1afba9aa850c8b65cdb7942e2078f27d0b0960efee6',
    TRANSFER_OWNERSHIP: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
    PAUSED: '0x0000000000000000000000000000000000000000000000000000000000000000',
    UNPAUSED: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  [ContractVersion.V2]: {
    RELEASE: '0xb21fb52d5749b80f3182f8c6992236b5e5576681880914484d7f4c9b062e619e',
    REVOKE: '0x44825a4b2df8acb19ce4e1afba9aa850c8b65cdb7942e2078f27d0b0960efee6',
    TRANSFER_OWNERSHIP: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0',
    PAUSED: '0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258',
    UNPAUSED: '0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa',
  },
}
