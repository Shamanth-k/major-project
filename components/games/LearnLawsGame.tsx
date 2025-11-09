import React, { useState, useEffect } from "react";
import { LearnLawsTopic } from "../../types";
import AICharacter from "../AICharacter";

const lawResources: LearnLawsTopic[] = [
  {
    title: "Preamble of the Constitution",
    description:
      "Let's watch a video that breaks down the Preamble, the soul of our Constitution.",
    type: "video",
    resourceId: "2OsiJp06GC8",
  },
  {
    title: "Fundamental Rights",
    description:
      "Here is an excellent article from a trusted source detailing the six Fundamental Rights of every citizen.",
    type: "article",
    resourceId: "https://knowindia.india.gov.in/profile/fundamental-rights.php",
  },
  {
    title: "Fundamental Duties",
    description:
      "This video clearly explains the Fundamental Duties that are expected of us as citizens.",
    type: "video",
    resourceId: "o2r_y9LAgpo",
  },
  {
    title: "Directive Principles of State Policy",
    description:
      "This article explains the guidelines for the government to create a just society. They are key to understanding the nation's goals.",
    type: "article",
    resourceId:
      "https://byjus.com/free-ias-prep/directive-principles-of-state-policy/",
  },
  {
    title: "Basic Structure Doctrine",
    description:
      "A landmark concept in Indian law! This video explains how the Supreme Court protects the core identity of our Constitution.",
    type: "video",
    resourceId: "eNjotac54nc",
  },
  {
    title: "Key Amendments (42nd and 44th)",
    description:
      "The 42nd and 44th amendments are some of the most significant changes to our constitution. This article will walk you through them.",
    type: "article",
    resourceId: "https://www.scribd.com/document/694413998/42nd-and-44th-CAA",
  },
];

interface LearnLawsGameProps {
  onComplete: () => void;
}

const LearnLawsGame: React.FC<LearnLawsGameProps> = ({ onComplete }) => {
  const [selectedTopic, setSelectedTopic] = useState<LearnLawsTopic | null>(
    null
  );
  const [fullFeedback, setFullFeedback] = useState(
    "Welcome to the Archives. Select a topic from the index to begin your study."
  );
  const [animatedFeedback, setAnimatedFeedback] = useState("");

  useEffect(() => {
    if (fullFeedback) {
      setAnimatedFeedback("");
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullFeedback.length) {
          setAnimatedFeedback((prev) => fullFeedback.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    }
  }, [fullFeedback]);

  const handleTopicSelect = (topic: LearnLawsTopic) => {
    setSelectedTopic(topic);
    setFullFeedback(topic.description);
  };

  const renderContent = () => {
    if (!selectedTopic) {
      return (
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-500">
            Select a topic to display its content.
          </p>
        </div>
      );
    }

    if (selectedTopic.type === "video") {
      return (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${selectedTopic.resourceId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    if (selectedTopic.type === "article") {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-orbitron text-indigo-300 mb-4">
            {selectedTopic.title}
          </h2>
          <p className="text-gray-300 mb-6">
            This topic is best learned through an in-depth article. Click the
            button below to open the resource in a new tab.
          </p>
          <a
            href={selectedTopic.resourceId}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 hover:scale-105"
          >
            Read Article
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-5xl h-[90vh] p-6 bg-gray-800/60 backdrop-blur-md rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-900/50 flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-orbitron text-indigo-300">Learn Laws</h1>
        <button
          onClick={onComplete}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-900/50 p-4 rounded-lg flex-shrink-0">
          <h2 className="text-xl font-orbitron text-center mb-4">
            Constitutional Index
          </h2>
          <div className="space-y-2 overflow-y-auto h-full pr-2">
            {lawResources.map((topic) => (
              <button
                key={topic.title}
                onClick={() => handleTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-md text-sm transition-colors ${
                  selectedTopic?.title === topic.title
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700/50 hover:bg-gray-700"
                }`}
              >
                {topic.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <div className="mb-4 min-h-[50px]">
            <AICharacter
              isTalking={!!animatedFeedback}
              message={animatedFeedback}
            />
          </div>
          <div className="flex-grow bg-gray-900/50 p-6 rounded-lg overflow-y-auto no-scrollbar">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnLawsGame;
