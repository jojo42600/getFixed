import React from 'react';
import { shallow, mount, render } from 'enzyme';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

//components
import FixButton from './../client/src/components/fixButton.jsx';
import CreateProblemModal from './../client/src/components/CreateProblemModal.jsx';

describe('<FixButton />', () => {
  it('should render', () => {
    const wrapper = shallow(<FixButton />);
    expect(wrapper.exists()).toBe(true);
  });

  it('should toggle modal state when clicked', () => {
    const wrapper = shallow(<FixButton />);
    const button = wrapper.find('button').at(0);

    button.simulate('click');
    expect(wrapper.state().modalOpen).toEqual(true);
  });

  it('should close the modal when the x button is clicked', () => {
    const handleClose = jest.fn();
    const wrapper = shallow(<CreateProblemModal closeMainModal={handleClose} />);
    const button = wrapper.find('button').at(0);

    button.simulate('click');
    expect(handleClose).toBeCalled();
  });

  it('should allow users to type data', () => {
    const wrapper = shallow(<CreateProblemModal />);
    const problemNameInput = wrapper.find('input').at(0);
    const problemDescriptionInput = wrapper.find('input').at(1);
    const problemPriceInput = wrapper.find('input').at(2);

    problemNameInput.value = 'iPhone Screen Fix';
    expect(wrapper.state().name).toEqual('iPhone Screen Fix');

    problemDescriptionInput.value = 'Can someone fix my broken screen please?';
    expect(wrapper.state().descrption).toEqual('Can someone fix my broken screen please?');
    
    problemPriceInput.value = '3';
    expect(wrapper.state.price).toEqual('3');
  });

  it('should call function to send file onDrop', () => {
    const handleDrop = jest.fn();
    const wrapper = mount(<CreateProblemModal handleDrop={handleDrop} />);
    const dropzone = wrapper.find('Dropzone').at(0);
    
    dropzone.simulate('drop');
    expect(handleDrop).toBeCalled();
  });

  it('should function to send form onClick', () => {
    const handleClick = jest.fn();
    const wrapper = mount(<CreateProblemModal handleClick={handleClick} />);
    const button = wrapper.find('button').at(1);

    button.simulate('click');
    expect(handleClick).toBeCalled();
  });
})