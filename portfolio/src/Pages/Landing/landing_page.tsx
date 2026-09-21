import React from 'react'

// import the golf elements

// import CSS
import "./landing_page.css"


// Called only when the ball reaches the hole
interface LandingPageProps {
    onComplete?: () => void
}

function LandingPage({  } : LandingPageProps) {
    return (
        <h1>Landing Page</h1>
    );
}

export default LandingPage