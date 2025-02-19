import React from 'react';
import PropTypes from 'prop-types';
import suffixedClassName from './suffixedClassName';
import findParentStructure from './helper';
import './style.scss';

class MultiLevelSelect extends React.Component {
  constructor() {
    super();
    this.state = {
      values: [],
      isMenuOpen: false,
    };
  }
  getClassName = (suffix) => {
    const { className } = this.props;

    return suffixedClassName(className, suffix);
  }

  onOptionsChange = () => {
    const { onChange } = this.props;
    const { values } = this.state;
    onChange(values);
  }

  removeSelectedGroup = ({ value }) => {
    const { values } = this.state;
    this.setState({ values: values.filter(data => data.value !== value) }, this.onOptionsChange);
  }

  handleClickOutside = (e) => {
    const { isMenuOpen } = this.state;

    return isMenuOpen && this.setState({ isMenuOpen: false });
  }

  toggleMenu = () => {
    const { isMenuOpen } = this.state;
    this.setState({ isMenuOpen: !isMenuOpen });
  }

  selectOption = (data, parent, event) => {
    const { values } = this.state;
    const { value, checked } = event.target;
    if (checked) {
      const parentValue = data.value;
      const updatedOption = data;
      const isOptionAvailable = values.findIndex(option => option.value === parentValue);

      if (isOptionAvailable === -1) {
        return this.setState(
          { values: [...values, updatedOption] },
          this.onOptionsChange,
        );
      }

      const updatedOptionsData = values.map((item) => {
        if (item.value === parentValue) return updatedOption;
        return item;
      });

      return this.setState({ values: updatedOptionsData }, this.onOptionsChange);
    }

    const uncheckedOption = this.removeOption(values, parent, value, parent);
    return this.setState({ values: uncheckedOption }, this.onOptionsChange);
  }

  // remove options
  removeOption = (
    values, optionParent, removeOption, removeOptionParent,
  ) => values.filter((item) => {
    if (item.value.includes(removeOption)) {
      // checks if parent are undefined bcz level 1 menu dont have parents
      if (removeOptionParent !== undefined && optionParent !== undefined) {
        // if the parents match then only the particular child
        // is removed from the options array
        if (optionParent === removeOptionParent) return false;
      }
      // this condition is satisfied for level 1 options
      if (removeOptionParent === optionParent) return false;
    }
    if (item.options) {
      return (item.options = this.removeOption(
        item.options, item.value, removeOption, removeOptionParent,
      )).length;
    }
    return item;
  })

  isOptionChecked = (values, optionValue, parent) => {
    if (parent) {
      return values.some((e) => {
        if (e.value === parent) {
          return e.options.some(item => item.value === optionValue);
        }
        if (e.options) return this.isOptionChecked(e.options, optionValue, parent);
        return false;
      });
    }

    return values.some(e => e.value === optionValue);
  }

  renderOptionsSelected = values => (
    values.map((item, i) => (
      <div
        key={i}
        className={`options-selected-container ${this.getClassName('options-selected-container')}`}
        onClick={event => event.stopPropagation()}
      >
        {this.renderSubOptionsSelected([item])}
        <div
          onClick={() => this.removeSelectedGroup(item)}
          className={`remove-group ${this.getClassName('remove-group')}`}
        >
          &#10005;
        </div>
      </div>
    ))
  )

  renderSubOptionsSelected = (data, counter = 0) => (
    data.map((item, index) => (
      <React.Fragment key={`${item.value}-${index}`}>
        {item.options
          && (
            <div>
              {counter === 0
                ? (<span className={`options-group ${this.getClassName('options-group')}`}>{` ${item.label}`}</span>)
                : ((data.length > 1 && index !== 0) ? `, ${item.label}` : ` ${item.label}`)}
              <span className={`options-group ${this.getClassName('options-group')}`}>{' ->'}</span>
              &nbsp;
            </div>
          )
        }
        {!item.options
          && (
            <div className={`options-value ${this.getClassName('options-value')}`}>
              {(data.length > 1 && index !== 0) ? `, ${item.label}`
                : counter === 0
                  ? <span className={`options-group ${this.getClassName('options-group')}`}>{item.label}</span>
                  : `${item.label}`}
              &nbsp;
            </div>
          )
        }
        {item.options && this.renderSubOptionsSelected(item.options, counter += 1)}
      </React.Fragment>
    ))
  )

  renderCaretButton = () => {
    const { isMenuOpen } = this.state;

    return (<>
      <span className='divider'/>
      <div className="multi-selector-button" onClick={this.toggleMenu}>
        <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={isMenuOpen ? "arrow-active" : "arrow"}><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg>
      </div>
      </>
    );
  }

  renderPlaceholder = () => {
    const { placeholder } = this.props;

    return (
      <div className={`multi-selector-placeholder ${this.getClassName('multi-selector-placeholder')}`}>
        {placeholder || 'Select'}
      </div>
    );
  }

  renderOptionsMenu = (options, parent = {}) => (
    options.map((item, i) => {
      if (item.options) {
        return (
          <div key={`${item.value}-${i}`} className="options-container">
            <div className={`options-label ${this.getClassName('options-label')}`}>{item.label}</div>
            {this.renderSubMenu(item, parent)}
          </div>
        );
      }
      return (
        <React.Fragment key={`${item.value}-${i}`}>{this.renderSubMenu(item, parent)}</React.Fragment>
      );
    })
  )

  renderSubMenu = (item, parent = {}) => {
    const { values } = this.state;
    const { options } = this.props;
    if (item.options) {
      return (
        <>
          <div className={`arrow-right ${this.getClassName('arrow-right')}`} />
          <div className={`options-sub-menu-container ${this.getClassName('options-sub-menu-container')}`}>
            <div
              className={`options-sub-menu-header ${this.getClassName('options-sub-menu-header')}`}
            >
              {item.value}
            </div>
            {this.renderOptionsMenu(item.options, item)}
          </div>
        </>
      );
    }
    const checked = this.isOptionChecked(values, item.value, parent.value);

    return (
      <label>
        <div className={`options-sub-menu ${this.getClassName('options-sub-menu')}`}>
          <input
            type="checkbox"
            value={item.value}
            checked={checked}
            name={item.label}
            onChange={(event) => {
              const self = this;
              if (!checked) {
                findParentStructure(values, item, item.value, options, [], parent.value, (data) => {
                  self.selectOption(data, parent.value, event);
                });
              } else {
                self.selectOption({}, parent.value, event);
              }
            }}
          />
          <div className="checkbox"><span className="checkmark" /></div>
          <div className={`options-label ${this.getClassName('options-label')}`}>{item.label}</div>
        </div>
      </label>
    );
  }

  render() {
    const { values, isMenuOpen } = this.state;
    const { options } = this.props;
    const myRef = React.createRef();
    const handleClickOutsideClose = (e) => {
      const { isMenuOpen } = this.state;
      if(myRef.current && isMenuOpen && !myRef.current.contains(e.target)) {
        return this.setState({ isMenuOpen: false });
      }
    }
    document.addEventListener('mousedown', handleClickOutsideClose);
    return (
      <div className="multi-level-selector-container">
        <div ref={myRef}
          className={`multi-selector-container ${this.getClassName('multi-selector-container')} ${isMenuOpen ? `active ${this.getClassName('active')}` : 'inactive'}`}
        >
          <div ref={myRef} className="multi-selector" onClick={this.toggleMenu}>
            {!values.length && this.renderPlaceholder()}
            {this.renderOptionsSelected(values)}
          </div>
          {this.renderCaretButton()}
        </div>
        <div ref={myRef}className={`multi-level-options-container ${this.getClassName('multi-level-options-container')} ${isMenuOpen ? `menu-open ${this.getClassName('menu-open')}` : `menu-close ${this.getClassName('menu-close')}`}`}>
          <div className="options-main-menu">
            {this.renderOptionsMenu(options)}
          </div>
        </div>
      </div>
    );
  }
}

MultiLevelSelect.propTypes = {
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })),
  })),
  className: PropTypes.string,
};

MultiLevelSelect.defaultProps = {
  placeholder: '',
  options: [],
  onChange: () => { },
  className: '',
};

export default MultiLevelSelect;
