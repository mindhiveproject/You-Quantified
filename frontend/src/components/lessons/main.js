import React from "react";
import { TextEditor } from "./editor/text_editor";
// import { QueryLesson } from "./editor/main";

export default function LessonBuilder() {
    return (
        <div className="scrollable">
            <TextEditor />
        </div>
    )
}