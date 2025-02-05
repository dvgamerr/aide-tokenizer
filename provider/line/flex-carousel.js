import dayjs from 'dayjs'
import 'dayjs/locale/th'

export default (movies) => {
  return movies.map((e) => {
    const theater = Object.keys(e.o_theater).sort((a, b) => a.localeCompare(b))
    const releaseDate = dayjs(e.t_release).locale('th').format('D MMMM YYYY')

    const badge = {
      major: {
        name: '🔗 Major',
        app: 'com.hlpth.majorcineplex',
        backgroundColor: '#dc3545cc',
        width: 67,
        height: 25,
      },
      sf: {
        name: '🔗 SF Cinema',
        app: 'com.shoppening.sf',
        backgroundColor: '#2f67cdcc',
        width: 82,
        height: 25,
      },
    }

    const poster = [
      { type: 'image', url: e.s_cover, size: 'full', aspectMode: 'cover', aspectRatio: '120:190', gravity: 'center', flex: 1 },
      ...theater.map((t, i) => ({
        type: 'box',
        layout: 'horizontal',
        contents: [{ type: 'text', text: badge[t].name, size: 'xxs', color: '#ffffff', align: 'center', gravity: 'center' }],
        backgroundColor: badge[t].backgroundColor,
        paddingAll: '2px',
        paddingEnd: '4px',
        flex: 0,
        position: 'absolute',
        offsetTop: '10px',
        cornerRadius: '5px',
        width: `${badge[t].width}px`,
        height: `${badge[t].height}px`,
        paddingStart: '4px',
        offsetEnd: `${(i > 0 ? badge[theater[i - 1]].width : 0) + 10 * (i + 1)}px`,
        action: { type: 'uri', label: 'action', uri: e.o_theater[t].url },
      })),
    ]
    return {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: poster,
            paddingAll: '0px',
            cornerRadius: '0px',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: e.s_name_th,
                color: '#ffffff',
                size: 'sm',
                weight: 'bold',
              },
              {
                type: 'text',
                text: `${releaseDate}`,
                color: '#ffffffcc',
                size: 'xxs',
              },
              {
                type: 'text',
                text: `${e.n_time} นาที`,
                color: '#ffffff',
                size: 'xxs',
                weight: 'regular',
                position: 'absolute',
                offsetTop: '29px',
                offsetEnd: '10px',
              },
            ],
            position: 'absolute',
            backgroundColor: '#464F69cc',
            offsetBottom: '0px',
            width: '100%',
            paddingStart: '20px',
            paddingTop: '10px',
            paddingBottom: '10px',
            paddingEnd: '10px',
            action: {
              type: 'uri',
              label: 'action',
              uri: encodeURI(`https://www.youtube.com/results?search_query=${e.s_name_en.replace(/\W/gi, '+')}+Official+Trailer`),
            },
          },
        ],
        paddingAll: '0px',
        cornerRadius: '0px',
      },
    }
  })
}
