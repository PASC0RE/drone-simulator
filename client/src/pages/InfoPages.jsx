import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import { REPO_URL } from '../config/site.js';
import { useLang, useT } from '../i18n/index.js';

// Short legal / help pages. Text is kept here (not in messages.js) because it is long-form.
const CONTENT = {
  terms: {
    mn: {
      title: 'Үйлчилгээний нөхцөл',
      sections: [
        ['Энэ сайт юу вэ', 'Skydeck нь төгсөлтийн төслийн хүрээнд бүтээсэн, хөтөч дээр ажилладаг дроны симулятор юм.'],
        ['Зохиомол өгөгдөл', 'Сайт дээрх бүх дрон болон тэдгээрийн жин, хурд, батерейны үзүүлэлт зохиомол. Симулятор бодит физикийг ойролцоолсон бөгөөд жинхэнэ дрон нисгэх сургалтыг орлохгүй.'],
        ['Ашиглалт', 'Сайтыг үнэгүй, "байгаагаар нь" ашиглана. Ажиллагаа түр тасалдах, мэдээлэл өөрчлөгдөх боломжтой.'],
        ['Брэндтэй холбоогүй', 'Skydeck нь GeoFS болон бусад симулятор, дроны үйлдвэрлэгчтэй ямар ч холбоогүй. Сайтад ашигласан нэр, лого, загвар бүгд төслийн өөрийнх.'],
      ],
    },
    en: {
      title: 'Terms',
      sections: [
        ['What this site is', 'Skydeck is a browser-based drone simulator built as a graduation project.'],
        ['Fictional data', 'Every drone on this site and its weight, speed and battery figures are fictional. The simulator approximates real physics and is not a substitute for real drone training.'],
        ['Use', 'The site is free and provided as it is. It may go offline at times and its content may change.'],
        ['No affiliation', 'Skydeck is not connected to GeoFS or any other simulator or drone maker. The names, logo and models used here belong to this project.'],
      ],
    },
  },
  privacy: {
    mn: {
      title: 'Нууцлалын бодлого',
      sections: [
        ['Бид юу цуглуулдаг вэ', 'Бүртгэл, нэвтрэлт, cookie байхгүй. Таны нэр, и-мэйл зэрэг хувийн мэдээллийг цуглуулдаггүй.'],
        ['Таны хөтөч дээр хадгалагдах зүйл', 'Сонгосон хэл болон Нарны уралдааны рекорд оноо зөвхөн таны хөтөчийн localStorage-д хадгалагдана. Хөтчийн мэдээллээ цэвэрлэвэл устана.'],
        ['Сервертэй харилцах', 'Дроны жагсаалтыг авахын тулд сайт манай API руу энгийн хүсэлт илгээнэ. Нислэгийн өгөгдөл, оноо серверт илгээгдэхгүй.'],
        ['Гуравдагч тал', 'Үсгийн фонтыг Google Fonts-оос ачаалдаг тул таны IP хаяг Google-д харагдана.'],
      ],
    },
    en: {
      title: 'Privacy policy',
      sections: [
        ['What we collect', 'There are no accounts, logins or cookies. We do not collect personal data such as your name or email.'],
        ['What stays in your browser', 'Your chosen language and your Sun Run best scores are saved in your browser\'s localStorage only. Clearing site data removes them.'],
        ['Talking to the server', 'To get the drone list the site sends a plain request to our API. Flight data and scores are never sent to the server.'],
        ['Third parties', 'Fonts are loaded from Google Fonts, so Google can see your IP address.'],
      ],
    },
  },
  troubleshooting: {
    mn: {
      title: 'Асуудал шийдвэрлэх',
      sections: [
        ['3D дүрс харагдахгүй', 'Хөтөч дээрээ "Hardware acceleration" (техник хангамжийн хурдатгал)-ыг асаагаад хуудсыг дахин ачаална уу. WebGL дэмждэггүй хуучин хөтөч дээр 3D ажиллахгүй.'],
        ['Сайт гацаж, удаан ажиллаж байна', 'Хэрэггүй табуудаа хааж үзнэ үү. Том дэлгэц дээр симулятор илүү их ачаалал өгдөг. Зайлшгүй бол хөтөчийн томруулалтыг багасгаж хараарай.'],
        ['"Сервер хариу өгсөнгүй" гэж гарч байна', 'Үнэгүй мэдээллийн сан идэвхгүй байвал сэрэхэд хэдэн секунд шаардаж болно. Хуудсыг дахин ачаалбал засрах нь элбэг. Энэ үед суулгасан жагсаалтаар ажиллана.'],
        ['Товчлуурууд ажиллахгүй байна', 'Симулятор дээр нэг удаа хулганаар дарж хуудсанд төвлөрүүлээд дахин оролдоно уу. Хөтөч Кирилл гарын байрлалтай байсан ч товчлуурууд ажиллана.'],
        ['Дрон осолдсон эсвэл батерей дууссан', 'R товчийг дарвал дрон эхлэх цэг дээр шинээр гарч ирнэ.'],
      ],
    },
    en: {
      title: 'Troubleshooting',
      sections: [
        ['The 3D view is blank', 'Turn on hardware acceleration in your browser and reload the page. Very old browsers without WebGL cannot show the 3D scenes.'],
        ['The site is slow or stutters', 'Close tabs you do not need. The simulator is heavy on large screens; zooming the browser out can help.'],
        ['"The server did not answer"', 'The free database may need a few seconds to wake up. Reloading usually fixes it. Meanwhile the built-in drone list is used.'],
        ['Keys do not work', 'Click once on the simulator so the page has focus, then try again. Keys work with a Cyrillic keyboard layout too.'],
        ['The drone crashed or ran out of battery', 'Press R to put the drone back on the start pad.'],
      ],
    },
  },
  contact: {
    mn: {
      title: 'Холбоо барих',
      sections: [
        ['Алдаа эсвэл санал', 'Алдаа, санал хүсэлтээ төслийн GitHub хуудсан дээрх Issues хэсэгт бичнэ үү.'],
        ['Төслийн тухай', 'Skydeck нь сурагчийн төгсөлтийн төсөл бөгөөд хөгжүүлэлт үргэлжилж байна.'],
      ],
    },
    en: {
      title: 'Contact',
      sections: [
        ['Bugs and ideas', 'Report bugs or suggestions in the Issues section of the project on GitHub.'],
        ['About the project', 'Skydeck is a student graduation project and is still being developed.'],
      ],
    },
  },
};

export default function InfoPage({ page }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const c = CONTENT[page][lang];
  return (
    <>
      <SiteHeader />
      <main className="page prose-page">
        <header className="page-head">
          <h1>{c.title}</h1>
          {page !== 'troubleshooting' && page !== 'contact' && <p>{t('info.updated')}</p>}
        </header>
        {c.sections.map(([h, body]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{body}</p>
          </section>
        ))}
        {page === 'contact' && (
          <p className="more">
            <a className="btn primary" href={REPO_URL} target="_blank" rel="noreferrer">{t('footer.source')}</a>
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
