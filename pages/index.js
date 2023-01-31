import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';
import {console} from "next/dist/compiled/@edge-runtime/primitives/console";

const Home = () => {
    // Don't retry more than 20 times
    const maxRetries = 60;
    const [input, setInput] = useState('');
    const [img, setImg] = useState('');
    // Numbers of retries
    const [retry, setRetry] = useState(0);
    // Number of retries left
    const [retryCount, setRetryCount] = useState(maxRetries);

    //busy state
    const [isGenerating, setIsGenerating] = useState(false);
    const [finalPrompt, setFinalPrompt] = useState('');

    // rest of code
    const onChange = (event) => {
        setInput(event.target.value);
    };

    // Add generateAction
    const generateAction = async () => {
        console.log('Generating...');

        // Add this check to make sure there is no double click
        if (isGenerating && retry === 0) return;

        // Set loading has started
        setIsGenerating(true);

        // If this is a retry request, take away retryCount
        if (retry > 0) {
            setRetryCount((prevState) => {
                if (prevState === 0) {
                    return 0;
                } else {
                    return prevState - 1;
                }
            });

            setRetry(0);
        }

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'image/jpeg',
            },
            body: JSON.stringify({ input }),
        });

        console.log('Received response index');
        const data = await response.json();

        if (response.status === 503) {
            console.log(`Model still loading. Estimated time: ${data.estimated_time} seconds.`);
            // Set the estimated_time property in state
            setRetry(data.estimated_time);
            return;
        }

        if (!response.ok) {
            console.log(`Error: ${data.error}`);
            // Stop loading
            setIsGenerating(false);
            return;
        }

        console.log('Received image');
        console.log(data);
        // Set final prompt here
        setFinalPrompt(input);
        // Remove content from input box
        setInput('');

        setImg(data.image);
        // Everything is all done -- stop loading!
        setIsGenerating(false);

    };
    const sleep = (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };
    // Add useEffect here
    useEffect(() => {
        const runRetry = async () => {
            if (retryCount === 0) {
                console.log(`Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`);
                setRetryCount(maxRetries);
                return;
            }

            console.log(`Trying again in ${retry} seconds.`);

            await sleep(retry * 1000);

            await generateAction();
        };

        if (retry === 0) {
            return;
        }

        runRetry();
    }, [retry]);

    return (
        <div className="root">
            <Head>
                {/* Add one-liner here */}
                <title>Silly picture generator | buildspace</title>
            </Head>
            <div className="container">
                <div className="header">
                    <div className="header-title">
                        {/* Add one-liner here */}
                        <h1>Silly smith picture generator</h1>
                    </div>
                    <div className="header-subtitle">
                        {/* Add description here */}
                        <h2>
                            Turn me into anyone you want! Make sure you refer to me as "slsmith" in the prompt
                        </h2>
                    </div>
                    {/* Add prompt container here */}
                    <div className="prompt-container">
                        <input className="prompt-box" value={input} onChange={onChange}/>
                        {/* Add your prompt button in the prompt container */}
                        <div className="prompt-buttons">
                            <a
                                className={
                                    isGenerating ? 'generate-button loading' : 'generate-button'
                                }
                                onClick={generateAction} >
                                <div className="generate">
                                    {isGenerating ? (
                                        <span className="loader"></span>
                                    ) : (
                                        <p>Generate</p>
                                    )}
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
                {img && (
                    <div className="output-content">
                        <Image src={img} width={512} height={512} alt={input} />
                        <p>{finalPrompt}</p>
                    </div>
                )}
            </div>
            <div className="badge-container grow">
                <a
                    href="https://buildspace.so/builds/ai-avatar"
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="badge">
                        <Image src={buildspaceLogo} alt="buildspace logo" />
                        <p>build with buildspace</p>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Home;
