import React, { useState, useEffect } from 'react';
import Carousel from './Carousel';
import Timer24h from './Timer24h';
import ProblemView from './ProblemView';
import { ApiService } from '../../services/api';

export default function HackathonWorkspace({ participant, domain, hackathon, onReselect }) {
  const [carouselItems, setCarouselItems] = useState([]);
  const [loadingCarousel, setLoadingCarousel] = useState(true);

  useEffect(() => {
    async function loadCarousel() {
      try {
        const items = await ApiService.getCarousel();
        setCarouselItems(items || []);
      } catch (err) {
        console.warn('Could not load carousel items:', err.message);
      } finally {
        setLoadingCarousel(false);
      }
    }
    loadCarousel();
  }, []);

  return (
    <div className="layout-container py-4 px-4">
      {/* 1. Admin-uploaded carousel */}
      {!loadingCarousel && <Carousel items={carouselItems} />}

      {/* 2. 24-hour countdown timer */}
      <Timer24h initialHackathon={hackathon} />

      {/* 3. Selected problem statement, 4. PPT Template Download, 5. Feedback form button, 6. PPT Submission */}
      <ProblemView
        problem={participant?.selectedProblem}
        selectedProblemId={participant?.selectedProblemId}
        domain={domain || participant?.domainInfo}
        feedbackUrl={hackathon?.feedbackFormUrl}
        pptUrl={hackathon?.pptSubmissionUrl}
        initialPptTemplate={hackathon?.pptTemplate}
        onReselect={onReselect}
      />
    </div>
  );
}

