import { HeroSection } from "@/components/landing/HeroSection";
import { CourseScheduleSection } from "@/components/landing/CourseScheduleSection";
import { StudentCertificatesSlider } from "@/components/landing/StudentCertificatesSlider";
import { ModernPartnerLogosSection } from "@/components/landing/ModernPartnerLogosSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ReviewsSection } from "@/components/landing/ReviewsSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { CallToActionSection } from "@/components/landing/CallToActionSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <main className="flex-1">
        <HeroSection />
        <CourseScheduleSection />
        <StudentCertificatesSlider />
        <ModernPartnerLogosSection />

        <FeaturesSection />
        <ReviewsSection />
        <WhyUsSection />
        <CallToActionSection />
      </main>
    </div>
  );
}

