import dayjs from 'dayjs'
import 'dayjs/locale/th'

export default (movies) => {
  return movies.map((e) => {
    const theater = Object.keys(e.o_theater).sort((a, b) => a.localeCompare(b))
    const releaseDate = dayjs(e.t_release).locale('th').format('D MMMM YYYY')

    const badge = {
      major: {
        app: 'com.hlpth.majorcineplex',
        backgroundColor: '#dc3545cc',
        height: 25,
        name: '🔗 Major',
        width: 67,
      },
      sf: {
        app: 'com.shoppening.sf',
        backgroundColor: '#2f67cdcc',
        height: 25,
        name: '🔗 SF Cinema',
        width: 82,
      },
    }

    const poster = [
      { aspectMode: 'cover', aspectRatio: '120:190', flex: 1, gravity: 'center', size: 'full', type: 'image', url: e.s_cover },
      ...theater.map((t, i) => ({
        action: { label: 'action', type: 'uri', uri: e.o_theater[t].url },
        backgroundColor: badge[t].backgroundColor,
        contents: [{ align: 'center', color: '#ffffff', gravity: 'center', size: 'xxs', text: badge[t].name, type: 'text' }],
        cornerRadius: '5px',
        flex: 0,
        height: `${badge[t].height}px`,
        layout: 'horizontal',
        offsetEnd: `${(i > 0 ? badge[theater[i - 1]].width : 0) + 10 * (i + 1)}px`,
        offsetTop: '10px',
        paddingAll: '2px',
        paddingEnd: '4px',
        paddingStart: '4px',
        position: 'absolute',
        type: 'box',
        width: `${badge[t].width}px`,
      })),
    ]
    return {
      body: {
        contents: [
          {
            contents: poster,
            cornerRadius: '0px',
            layout: 'vertical',
            paddingAll: '0px',
            type: 'box',
          },
          {
            action: {
              label: 'action',
              type: 'uri',
              uri: encodeURI(`https://www.youtube.com/results?search_query=${e.s_name_en.replace(/\W/gi, '+')}+Official+Trailer`),
            },
            backgroundColor: '#464F69cc',
            contents: [
              {
                color: '#ffffff',
                size: 'sm',
                text: e.s_name_th,
                type: 'text',
                weight: 'bold',
              },
              {
                color: '#ffffffcc',
                size: 'xxs',
                text: `${releaseDate}`,
                type: 'text',
              },
              {
                color: '#ffffff',
                offsetEnd: '10px',
                offsetTop: '29px',
                position: 'absolute',
                size: 'xxs',
                text: `${e.n_time} นาที`,
                type: 'text',
                weight: 'regular',
              },
            ],
            layout: 'vertical',
            offsetBottom: '0px',
            paddingBottom: '10px',
            paddingEnd: '10px',
            paddingStart: '20px',
            paddingTop: '10px',
            position: 'absolute',
            type: 'box',
            width: '100%',
          },
        ],
        cornerRadius: '0px',
        layout: 'vertical',
        paddingAll: '0px',
        type: 'box',
      },
      size: 'kilo',
      type: 'bubble',
    }
  })
}
