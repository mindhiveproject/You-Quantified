import devicesRaw from '../../../metadata/devices.json'
import React from 'react';
import { ModalDataInformation } from './data_sources_display';

export function LeftInfoPane({ currentDevice }) {
    /*
    if (currentDevice?.name === "Upload") {
      return <FileUploader />;
    }*/
  
    return (
      <div className="w-100 h-100 ms-3 pe-4-5 mb-5">
        {currentDevice?.card_type === "generic" && (
          <div className="card rounded-0 text-start black-hover border-dark">
            <GenericInfoPane currentDevice={currentDevice} />
          </div>
        )}
      </div>
    );
  }
  
  function GenericInfoPane({ currentDevice }) {
    const deviceJsonInfo = devicesRaw.find(
      ({ device }) => device === currentDevice?.device
    );
  
    return (
      <div className="p-4">
        <h4 className="mb-2">{deviceJsonInfo.device}</h4>
        <div>
          <span>{deviceJsonInfo.description}</span>
          <div className="mt-3">
            <h6>Available data streams</h6>
            <p>
              This device can stream the following data to a visualization. Hover
              to learn more.
            </p>
            <ModalDataInformation
              source={deviceJsonInfo.device}
              groupData={true}
            />
          </div>
        </div>
      </div>
    );
  }