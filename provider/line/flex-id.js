export default (Id) => {
  return {
    body: {
      action: {
        data: '[ID]',
        displayText: Id,
        label: 'action',
        type: 'postback',
      },
      contents: [
        {
          color: '#1DB446',
          flex: 1,
          size: 'xs',
          text: 'ID : ',
          type: 'text',
          weight: 'bold',
        },
        {
          color: '#aaaaaa',
          flex: 10,
          size: 'xs',
          text: Id,
          type: 'text',
          weight: 'bold',
          wrap: true,
        },
      ],
      justifyContent: 'center',
      layout: 'horizontal',
      paddingBottom: 'sm',
      paddingEnd: 'none',
      paddingStart: 'lg',
      paddingTop: 'sm',
      type: 'box',
    },
    size: 'mega',
    styles: {
      footer: {
        separator: true,
      },
    },
    type: 'bubble',
  }
}
